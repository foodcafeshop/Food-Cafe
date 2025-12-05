// Helper to generate CSV string without downloading
export const generateCSV = (data: any[], columns: string[] = []): string => {
    if (!data || data.length === 0) {
        return '';
    }

    // Determine headers: use provided columns or keys from the first object
    const headers = columns.length > 0 ? columns : Object.keys(data[0]);

    // Construct CSV content
    return [
        headers.join(','), // Header row
        ...data.map(row =>
            headers.map(header => {
                const value = row[header];
                // Handle different value types
                if (value === null || value === undefined) return '';
                if (typeof value === 'object') return `"${JSON.stringify(value).replace(/"/g, '""')}"`; // Escape quotes
                if (typeof value === 'string') return `"${value.replace(/"/g, '""')}"`; // Escape quotes
                return value;
            }).join(',')
        )
    ].join('\n');
};

export const exportToCSV = (data: any[], filename: string, columns: string[] = []) => {
    const csvContent = generateCSV(data, columns);
    if (!csvContent) {
        console.warn("No data to export");
        return;
    }

    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

export const parseCSV = (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();

        reader.onload = (event) => {
            const text = event.target?.result as string;
            if (!text) {
                resolve([]);
                return;
            }

            const lines = text.split('\n').filter(line => line.trim() !== '');
            if (lines.length < 2) {
                resolve([]); // Empty or only header
                return;
            }

            const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));

            const results = lines.slice(1).map(line => {
                // Simple CSV parser - doesn't handle commas inside quotes perfectly without regex
                // For this use case, splitting by comma is a starting point, but let's be slightly more robust
                // Regex to match CSV fields: values in quotes OR values without commas
                const regex = /(".*?"|[^",\s]+)(?=\s*,|\s*$)/g;
                // Actually simple split is risky. Let's use a quoted-split approach manually or a better regex.

                // Matches: 
                // "quoted string" OR non-comma-sequence
                // Followed by failure to match (comma or end of string)

                // Simplified manual parsing for better reliability with quotes
                const values: string[] = [];
                let current = '';
                let inQuotes = false;

                for (let i = 0; i < line.length; i++) {
                    const char = line[i];
                    if (char === '"') {
                        if (inQuotes && line[i + 1] === '"') {
                            current += '"'; // Escaped quote
                            i++;
                        } else {
                            inQuotes = !inQuotes;
                        }
                    } else if (char === ',' && !inQuotes) {
                        values.push(current);
                        current = '';
                    } else {
                        current += char;
                    }
                }
                values.push(current); // Last value

                const entry: any = {};
                headers.forEach((header, index) => {
                    let value = values[index]?.trim();
                    // Clean up wrapping quotes if present from manual parsing remnants usually clean
                    // But if our manual parser kept them? No, we didn't add them to 'current' except for inner content

                    // Basic type inference
                    if (value === 'true') entry[header] = true;
                    else if (value === 'false') entry[header] = false;
                    else if (!isNaN(Number(value)) && value !== '') entry[header] = Number(value);
                    else entry[header] = value;
                });
                return entry;
            });

            resolve(results);
        };

        reader.onerror = (error) => reject(error);
        reader.readAsText(file);
    });
};
