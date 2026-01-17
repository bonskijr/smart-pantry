import { v7 as uuidv7 } from 'uuid';

const BASE_URL = 'http://localhost:3000';

async function testBulkImport() {
    console.log('🧪 Testing Bulk Import API...\n');

    const validCategory = "Grains"; // Should exist from seed data
    // Use a random UUID to ensure this category definitely does NOT exist
    const nonExistentCategory = `Category_${uuidv7().substring(0, 8)}`; 

    console.log(`ℹ️  Testing with:`);
    console.log(`    Valid Category: "${validCategory}"`);
    console.log(`    Missing Category: "${nonExistentCategory}" (Should fail)\n`);

    // Payload with mixed scenarios
    const payload = {
        items: [
            // 1. Valid item with existing category
            {
                name: "Bulk Rice", 
                quantity: 50, 
                categoryName: validCategory, 
                expirationDate: new Date().toISOString() 
            },
            // 2. Valid item with MISSING category (Should FAIL in new logic)
            {
                name: "Mystery Item", 
                quantity: 10, 
                categoryName: nonExistentCategory, 
                expirationDate: new Date().toISOString() 
            },
            // 3. Invalid item (Missing name)
            {
                quantity: 5, 
                categoryName: validCategory 
            },
            // 4. Invalid Quantity
            {
                name: "Bad Quantity Item",
                quantity: "loads", 
                categoryName: validCategory 
            }
        ]
    };

    try {
        console.log('📦 Sending Bulk Import Request...');
        const res = await fetch(`${BASE_URL}/items/bulk`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        if (!res.ok) throw new Error(`Request failed: ${res.statusText}`);

        const data = await res.json();
        
        console.log('\n📊 Results:');
        console.log(`   Success: ${data.success}`);
        console.log(`   Failed:  ${data.failed}`);
        
        console.log('\n❌ Errors:');
        data.errors.forEach((err: any, i: number) => {
            console.log(`   ${i+1}. [${err.item.name || 'Unknown Item'}] -> ${err.reason}`);
        });

        console.log('\n✅ Imported Items:');
        data.importedItems.forEach((item: any, i: number) => {
            console.log(`   ${i+1}. ${item.name} (Qty: ${item.quantity})`);
        });

        // Verification Logic
        if (data.success === 1 && data.failed === 3) {
            console.log('\n✨ TEST PASSED: Logic correctly filtered invalid categories and bad data.');
        } else {
            console.log('\n⚠️  TEST WARNING: Expected 1 success and 3 failures.');
        }

    } catch (error) {
        console.error('❌ Test failed:', error);
    }
}

testBulkImport();