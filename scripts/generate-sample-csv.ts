import * as fs from 'fs';
import * as path from 'path';

const fruitNames = ['Apple', 'Banana', 'Orange', 'Strawberry', 'Grapes', 'Watermelon', 'Blueberry', 'Peach', 'Pear', 'Cherry', 'Mango', 'Pineapple', 'Kiwi', 'Plum', 'Raspberry', 'Blackberry'];
const vegetableNames = ['Carrot', 'Broccoli', 'Spinach', 'Tomato', 'Cucumber', 'Potato', 'Onion', 'Garlic', 'Bell Pepper', 'Lettuce', 'Cabbage', 'Cauliflower', 'Eggplant', 'Zucchini', 'Celery', 'Asparagus'];
const adjectives = ['Fresh', 'Organic', 'Sweet', 'Crunchy', 'Ripe', 'Succulent', 'Large', 'Small', 'Green', 'Red', 'Seasonal'];

const csvRows = ['Name,Quantity,Category,ExpirationDate'];

for (let i = 0; i < 100; i++) {
    const isFruit = Math.random() > 0.5;
    const baseNames = isFruit ? fruitNames : vegetableNames;
    const category = isFruit ? 'Fruits' : 'Vegetables';
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const baseName = baseNames[Math.floor(Math.random() * baseNames.length)];
    const quantity = Math.floor(Math.random() * 20) + 1;
    const expirationDate = new Date(new Date().setDate(new Date().getDate() + Math.round(Math.random() * 60) - 10)).toISOString().split('T')[0];
    
    csvRows.push(`${adjective} ${baseName} ${i + 1},${quantity},${category},${expirationDate}`);
}

const csvContent = csvRows.join('\n');
const outputPath = path.join(process.cwd(), 'sample_pantry_items.csv');
fs.writeFileSync(outputPath, csvContent);

console.log(`Generated 100 sample items in ${outputPath}`);
