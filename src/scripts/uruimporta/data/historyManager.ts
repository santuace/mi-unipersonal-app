import fs from 'fs';
import path from 'path';
import { HistoryItem } from '../types';

const HISTORY_FILE_PATH = path.join(__dirname, 'sent-history.json');

export function loadHistory(): HistoryItem[] {
    try {
        if (fs.existsSync(HISTORY_FILE_PATH)) {
            const data = fs.readFileSync(HISTORY_FILE_PATH, 'utf-8');
            const parsed = JSON.parse(data);

            // Map string dates back to Date objects
            return parsed.map((item: any) => ({
                sku: item.sku,
                fecha_publicacion: new Date(item.fecha_publicacion)
            }));
        }
    } catch (error) {
        console.error("⚠️ Error loading history file:", error);
    }
    return [];
}

export function saveHistory(newItems: HistoryItem[]) {
    try {
        const existingHistory = loadHistory();

        // Merge new items, keeping only the most recent sending date per SKU
        const mergedMap = new Map<string, Date>();

        existingHistory.forEach(item => mergedMap.set(item.sku, item.fecha_publicacion));
        newItems.forEach(item => mergedMap.set(item.sku, item.fecha_publicacion));

        // Convert map back to array and filter out history older than 60 days
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 60);

        const updatedHistory: HistoryItem[] = Array.from(mergedMap.entries())
            .map(([sku, fecha_publicacion]) => ({ sku, fecha_publicacion }))
            .filter(item => item.fecha_publicacion > thirtyDaysAgo)
            .sort((a, b) => b.fecha_publicacion.getTime() - a.fecha_publicacion.getTime());

        fs.writeFileSync(HISTORY_FILE_PATH, JSON.stringify(updatedHistory, null, 2), 'utf-8');
        console.log(`✅ Saved ${newItems.length} new items to sent-history.json (Total tracking: ${updatedHistory.length})`);
    } catch (error) {
        console.error("❌ Error saving history file:", error);
    }
}
