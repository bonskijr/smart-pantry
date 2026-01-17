
import { v7 as uuidv7 } from 'uuid';

const BASE_URL = 'http://localhost:3000';

async function testApi() {
    console.log('🧪 Testing Smart Pantry API...\n');

    try {
        // 1. GET /items
        console.log('1️⃣  Fetching all items (GET /items)...');
        const itemsRes = await fetch(`${BASE_URL}/items`);
        if (!itemsRes.ok) throw new Error(`Failed to fetch items: ${itemsRes.statusText}`);
        const items = await itemsRes.json();
        console.log(`   ✅ Success! Found ${items.length} items.`);

        if (items.length === 0) {
            console.warn('   ⚠️  No items found. Cannot perform POST test without a valid Category ID from existing items.');
            return;
        }

        const firstCategory = items[0].category;
        if (!firstCategory) {
            console.warn('   ⚠️  First item has no category. Skipping POST test.');
            return;
        }
        const categoryId = firstCategory.id;
        console.log(`   ℹ️  Using Category ID from first item: ${categoryId}\n`);

        // 2. POST /items
        console.log('2️⃣  Creating a new item (POST /items)...');
        const newItem = {
            name: `Test Item ${uuidv7().substring(0, 8)}`,
            quantity: 1,
            categoryId: categoryId,
            expirationDate: new Date(Date.now() + 86400000).toISOString() // Tomorrow
        };

        const createRes = await fetch(`${BASE_URL}/items`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newItem),
        });

        if (!createRes.ok) throw new Error(`Failed to create item: ${createRes.statusText}`);
        const createdItem = await createRes.json();
        console.log('   ✅ Success! Created item:');
        console.log(`      ID: ${createdItem.id}`);
        console.log(`      Name: ${createdItem.name}`);
        console.log(`      Category: ${categoryId}\n`);

        // 3. GET /expiring
        console.log('3️⃣  Fetching expiring items (GET /expiring)...');
        const expiringRes = await fetch(`${BASE_URL}/expiring`);
        if (!expiringRes.ok) throw new Error(`Failed to fetch expiring items: ${expiringRes.statusText}`);
        const expiringItems = await expiringRes.json();
        console.log(`   ✅ Success! Found ${expiringItems.length} expiring items.`);

        console.log('\n🎉 All tests passed!');

    } catch (error) {
        console.error('\n❌ Test failed:', error);
        console.log('\n💡 Tip: Make sure the server is running with: npx tsx server/app.ts');
    }
}

testApi();
