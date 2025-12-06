import { NextRequest, NextResponse } from 'next/server';
import { GoogleGenerativeAI } from '@google/generative-ai';
import Papa from 'papaparse';
import JSZip from 'jszip';

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const files = formData.getAll('files') as File[];

        if (!files || files.length === 0) {
            return NextResponse.json(
                { error: 'No files uploaded' },
                { status: 400 }
            );
        }

        const apiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;
        if (!apiKey) {
            return NextResponse.json(
                { error: 'Gemini API Key is missing' },
                { status: 500 }
            );
        }

        const genAI = new GoogleGenerativeAI(apiKey);
        const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

        const prompt = `
      You are an expert menu digitizer.
      I will provide images of a restaurant menu.
      Your task is to extract all menu items and return them in a structured JSON format.
      
      The structure should be hierarchical:
      [
        {
          "menu_name": "Main Menu" (or "Drinks Menu" etc, infer from context),
          "description": "General description if available",
          "categories": [
            {
              "category_name": "Appetizers",
              "image_search_term": "appetizers food", // Keyword for category image
              "tags": ["starters", "crispy"], // relevant list of tags
              "items": [
                {
                  "name": "Spring Rolls",
                  "description": "Crispy vegetable rolls (If missing from text, GENERATE a short, appetizing description based on the name)",
                  "price": 5.99,
                  "dietary_type": "veg", // MUST be one of: "veg", "non_veg", "vegan".
                  "image_search_term": "spring rolls", // A short keyword to search for an image (e.g. "burger", "pasta", "coke")
                  "tags": ["asian", "fried", "starter"] // 2-3 relevant list of tags
                }
              ]
            }
          ]
        }
      ]

      IMPORTANT: 
      1. "dietary_type" must STRICTLY be: "veg", "non_veg", "vegan", or null.
      2. If "description" is missing, YOU MUST GENERATE one.
      3. "image_search_term" should be a simple 2-3 word keyword describing the food item OR category.
      4. "tags": Generate 2-4 lowercase tags describing flavor, cuisine, or texture (e.g. "spicy", "italian", "crunchy").
      5. If an item has MULTIPLE prices (e.g. "Dal Makhani 300/180" or "Pizza 100/200/300"):
         - Create SEPARATE items for each price row.
         - Infer the variant name from context (Small/Medium/Large, Quarter/Half/Full).
         - If context is 3 prices: "Small", "Medium", "Large".
         - If context is 4 prices: "Small", "Medium", "Large", "Extra Large" (or similar appropriate logic).
         - Append the variant to the name: "Pizza (Small)", "Pizza (Medium)", etc.

      Do not include any markdown formatting (like \`\`\`json). Just return the raw JSON array.
    `;

        const imageParts = await Promise.all(
            files.map(async (file) => {
                const arrayBuffer = await file.arrayBuffer();
                const buffer = Buffer.from(arrayBuffer);
                return {
                    inlineData: {
                        data: buffer.toString('base64'),
                        mimeType: file.type,
                    },
                };
            })
        );

        const result = await model.generateContent([prompt, ...imageParts]);
        const response = await result.response;
        const text = response.text();

        // Clean up the response
        let jsonString = text.trim();

        // Robust extraction: Find the first '[' and the last ']'
        const firstBracket = jsonString.indexOf('[');
        const lastBracket = jsonString.lastIndexOf(']');

        if (firstBracket !== -1 && lastBracket !== -1) {
            jsonString = jsonString.substring(firstBracket, lastBracket + 1);
        } else {
            // Fallback cleanup if brackets aren't clear (unlikely for valid JSON array)
            if (jsonString.startsWith('```json')) {
                jsonString = jsonString.replace(/^```json/, '').replace(/```$/, '');
            } else if (jsonString.startsWith('```')) {
                jsonString = jsonString.replace(/^```/, '').replace(/```$/, '');
            }
        }

        let parsedData = [];
        try {
            parsedData = JSON.parse(jsonString);
        } catch (e) {
            console.error("Failed to parse JSON from Gemini:", e);
            console.error("Raw text was:", text); // Log the full text for debugging
            return NextResponse.json(
                { error: 'Failed to parse AI response. The menu might be too complex or the image unclear. Please try again.' },
                { status: 500 }
            );
        }

        // --- Helper to validate enums ---
        const validateDietary = (val: string): string => {
            const lower = val?.toLowerCase()?.trim() || 'veg';
            if (['veg', 'non_veg', 'vegan'].includes(lower)) return lower;
            if (lower === 'vegetarian') return 'veg';
            if (lower === 'non-veg' || lower === 'nonveg') return 'non_veg';
            return 'veg'; // Default fallback
        };

        const generateImageUrl = (term: string) => {
            if (!term) return '';
            const keyword = encodeURIComponent(term.trim());
            // Using Bing Thumbnails as a robust fallback for keyword-based images
            // This endpoint is generally reliable for visualization purposes
            return `https://tse2.mm.bing.net/th?q=${keyword}&w=300&h=300&c=7&rs=1&p=0&dpr=3&pid=1.7&mkt=en-IN&adlt=moderate`;
        };



        // --- Normalize Data for CSVs ---
        const menus: any[] = [];
        const categories: any[] = [];
        const menuItems: any[] = [];
        const menuLinks: any[] = []; // menu_name, category_name
        const categoryLinks: any[] = []; // category_name, item_name

        // Sets to avoid duplicates
        const uniqueCategories = new Set<string>();
        const uniqueItems = new Set<string>();

        parsedData.forEach((menu: any, menuIndex: number) => {
            const menuName = menu.menu_name || `Menu ${menuIndex + 1}`;
            menus.push({
                name: menuName,
                description: menu.description || '',
                dietary_type: 'all', // Menus can be 'all'
                tags: '{}', // CSV standard text
                images: ''
            });

            if (menu.categories && Array.isArray(menu.categories)) {
                menu.categories.forEach((cat: any, catIndex: number) => {
                    const catName = cat.category_name || `Category ${catIndex + 1}`;

                    if (!uniqueCategories.has(catName)) {
                        uniqueCategories.add(catName);
                        const catImageUrl = generateImageUrl(cat.image_search_term || catName);
                        categories.push({
                            name: catName,
                            image: catImageUrl,
                            tags: Array.isArray(cat.tags) ? cat.tags.join(',') : '',
                            dietary_type: 'all' // Categories can be 'all'
                        });
                    }

                    // Link Menu -> Category
                    menuLinks.push({
                        menu_name: menuName,
                        category_name: catName,
                        sort_order: catIndex
                    });

                    if (cat.items && Array.isArray(cat.items)) {
                        cat.items.forEach((item: any, itemIndex: number) => {
                            const itemName = item.name || `Item ${itemIndex + 1}`;

                            const itemKey = `${itemName}-${item.price}`; // Simple de-dupe key

                            if (!uniqueItems.has(itemKey)) {
                                uniqueItems.add(itemKey);
                                const imageUrl = generateImageUrl(item.image_search_term || itemName);
                                menuItems.push({
                                    name: itemName,
                                    description: item.description || '',
                                    price: Number(item.price) || 0,
                                    original_price: null, // Only for discounted items
                                    images: imageUrl ? [imageUrl] : [],
                                    dietary_type: validateDietary(item.dietary_type),
                                    tags: Array.isArray(item.tags) ? item.tags.join(',') : '',
                                    is_available: true,
                                    is_popular: false,
                                    is_featured: false
                                });
                            }

                            // Link Category -> Item
                            categoryLinks.push({
                                category_name: catName,
                                item_name: itemName,
                                sort_order: itemIndex
                            });
                        });
                    }
                });
            }
        });

        // --- Generate ZIP ---
        const zip = new JSZip();

        if (menus.length) zip.file("menus.csv", Papa.unparse(menus));
        if (categories.length) zip.file("categories.csv", Papa.unparse(categories));
        if (menuItems.length) zip.file("menu_items.csv", Papa.unparse(menuItems));
        if (menuLinks.length) zip.file("menu_links.csv", Papa.unparse(menuLinks));
        if (categoryLinks.length) zip.file("category_links.csv", Papa.unparse(categoryLinks));

        const zipBuffer = await zip.generateAsync({ type: "uint8array" });

        return new NextResponse(zipBuffer as any, {
            status: 200,
            headers: {
                'Content-Type': 'application/zip',
                'Content-Disposition': 'attachment; filename="digitized_menu.zip"',
            },
        });

    } catch (error) {
        console.error('Error in digitize-menu:', error);
        return NextResponse.json(
            { error: 'Internal Server Error' },
            { status: 500 }
        );
    }
}
