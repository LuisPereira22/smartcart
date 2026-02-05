const MOCK_DB = {
    fast_food_codes: {
        // Common EAN examples for demo (if user can't scan real ones)
        "123456789": {
            name: "Demo: Energy Bar",
            category: "Snack",
            nutriments: {
                "energy-kcal_100g": 350,
                proteins_100g: 12,
                sugars_100g: 18,
                fat_100g: 10
            },
            image_url: "https://via.placeholder.com/150?text=Energy+Bar",
            allergens: "Nuts, Soy"
        }
    },
    fresh_categories: [
        { id: 'fruits', name: 'Fruits', icon: 'fa-apple-alt' },
        { id: 'vegetables', name: 'Vegetables', icon: 'fa-carrot' },
        { id: 'bakery', name: 'Bakery', icon: 'fa-bread-slice' },
        { id: 'meat', name: 'Meat & Demo', icon: 'fa-drumstick-bite' }
    ],
    fresh_products: {
        fruits: [
            { id: 'f1', name: 'Apple (Gala)', kCal: 52, protein: 0.3, sugar: 10, b12: 0, unit: 'piece' },
            { id: 'f2', name: 'Banana', kCal: 89, protein: 1.1, sugar: 12, b12: 0, unit: 'piece' },
            { id: 'f3', name: 'Orange', kCal: 47, protein: 0.9, sugar: 9, b12: 0, unit: 'piece' }
        ],
        vegetables: [
            { id: 'v1', name: 'Carrot', kCal: 41, protein: 0.9, sugar: 4.7, b12: 0, unit: 'piece' },
            { id: 'v2', name: 'Broccoli', kCal: 34, protein: 2.8, sugar: 1.7, b12: 0, unit: 'head' }
        ],
        bakery: [
            { id: 'b1', name: 'Whole Wheat Bread', kCal: 247, protein: 13, sugar: 6, b12: 0, unit: 'slice' },
            { id: 'b2', name: 'Croissant', kCal: 406, protein: 8.2, sugar: 11, b12: 0.2, unit: 'piece' }
        ],
        meat: [
            { id: 'm1', name: 'Chicken Breast', kCal: 165, protein: 31, sugar: 0, b12: 0.3, unit: '100g' },
            { id: 'm2', name: 'Salmon Fillet', kCal: 208, protein: 20, sugar: 0, b12: 3.2, unit: '100g' }
        ]
    }
};
