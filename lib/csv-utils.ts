import Papa from 'papaparse';

// Helper to generate CSV string without downloading
export const generateCSV = (data: any[], columns: string[] = []): string => {
    if (!data || data.length === 0) {
        return '';
    }

    // Filter data if columns are provided
    const csvData = columns.length > 0
        ? data.map(row => {
            const newRow: any = {};
            columns.forEach(col => {
                newRow[col] = row[col];
            });
            return newRow;
        })
        : data;

    return Papa.unparse(csvData, {
        quotes: true, // Force quotes makes it safer for embedded commas
        header: true,
        skipEmptyLines: true
    });
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
        Papa.parse(file, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: true, // Automatically converts numbers and booleans
            complete: (results) => {
                if (results.errors.length > 0) {
                    console.error("CSV Parsing Errors:", results.errors);
                }

                // Post-process to parse JSON strings (arrays/objects)
                const processedData = results.data.map((row: any) => {
                    const newRow: any = { ...row };
                    Object.keys(newRow).forEach(key => {
                        const value = newRow[key];
                        if (typeof value === 'string') {
                            // precise check for array or object syntax
                            const trimmed = value.trim();
                            if ((trimmed.startsWith('[') && trimmed.endsWith(']')) ||
                                (trimmed.startsWith('{') && trimmed.endsWith('}'))) {
                                try {
                                    newRow[key] = JSON.parse(value);
                                } catch (e) {
                                    // keep as string if parse fails
                                }
                            }
                        }
                    });
                    return newRow;
                });

                resolve(processedData);
            },
            error: (error) => {
                reject(error);
            }
        });
    });
};
