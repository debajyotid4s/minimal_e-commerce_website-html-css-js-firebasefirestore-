import { db } from '../Frontend/config/firebase-config.js';
import { collection, addDoc, getDocs, query, where } from "https://www.gstatic.com/firebasejs/9.22.0/firebase-firestore.js";

// Product data
const productsData = [
  {
    id: 1,
    name: "Ausswar Mini Classical Guitar",
    price: 8999,
    image: "assets/ASCG.jpg",
    category: "Guitar",
    description: "Ausswar Mini Classical Guitar is a compact and portable guitar designed for musicians on the go. It features a solid wood body, nylon strings, and a beautiful finish, making it perfect for both beginners and experienced players.",
    features: [
      "Scale Length - 17inches",
      "Total Length - 29inches",
      "Nut Width - 48 mm",
      "Body Depth - 2.9inches",
      "Body length - 12.5inches",
      "Body - Laminated Teak Wood",
      "Neck - Mahogany Wood",
      "Fretboard - Rosewood",
      "Bridge - Rosewood "
    ],
    stock: 15,
    sku: "AMCG-001",
    videoUrl: "https://youtu.be/jdlqcAAuZeA?si=kpDRZGsoTq6MI2aJ",
    additionalImages: [
      "assets/ASCG.jpg",
      "assets/ASCG2.jpg",
      "assets/ASCG3.jpg",
      "assets/ASCG4.jpg",
      "assets/ASCG5.jpg",
      "assets/ASCG6.jpg"
    ]
  },
  {
    id: 2,
    name: "Anusswar Wooden Pick",
    price: 180,
    image: "assets/AWP1.jpg",
    category: "Accessories",
    description: "Anusswar Wooden Pick is a handcrafted guitar pick made from high-quality wood. It provides a warm and natural tone, making it ideal for acoustic and electric guitars. The ergonomic design ensures a comfortable grip for extended playing sessions.",
    features: [
      "Material - Wood",
      "Thickness - 1.5mm",
      "Shape - Standard",
      "Finish - Smooth",
      "Grip - Ergonomic"
    ],
    stock: 50,
    sku: "AWP-002",
    additionalImages: [
      "assets/AWP1.jpg",
      "assets/AWP2.jpg"
    ]
  },
  {
    id: 3,
    name: "Anusswar Wooden Pendent",
    price: 150,
    image: "assets/ASPen1.jpg",
    category: "Accessories",
    description: "Anusswar Wooden Pendent is a unique and stylish accessory made from high-quality wood. It features intricate carvings and designs, making it a perfect gift for music lovers. The pendant comes with a durable cord for easy wearing.",
    features: [
      "Material - Wood",
      "Size - 2 inches",
      "Design - Customizable",
      "Finish - Smooth",
      "Cord - Adjustable"
    ],
    stock: 30,
    sku: "AWP-003",
    additionalImages: [
      "assets/ASPen1.jpg",
      "assets/ASPen2.jpg",
      "assets/ASPen3.jpg"
    ]
  },
  {
    id: 4,
    name: "Anusswar's Black Sandhi",
    price: 17100,
    image: "assets/ASS1.jpg",
    category: "Sandhi",
    description: "Anusswar's Black Sandhi is a premium quality guitar designed for professional musicians. It features a solid spruce top, mahogany back and sides, and a beautiful black finish. experience the dotara in a ukulele body.",
    features: [
      "Body - Solid Spruce",
      "Neck - Mahogany",
      "Fretboard - Rosewood",
      "Bridge - Rosewood",
      "Finish - Glossy Black"
    ],
    stock: 20,
    sku: "ABS-004",
    videoUrl: "https://youtu.be/bo5BZ3N7geM?si=TiaeiY5d_7LRT8cB",
    additionalImages: [
      "assets/ASS1.jpg",
      "assets/ASS2.jpg",
      "assets/ASS3.jpg",
      "assets/ASS4.jpg"
    ]
  },
  {
    id: 5,
    name: "Anusswar's Ukulele",
    price: 9000,
    image: "assets/ASU1.jpg",
    category: "Ukulele",
    description: "Anusswar's Ukulele is a beautifully crafted instrument made from high-quality wood. It features a soprano size, making it perfect for beginners and experienced players alike. The ukulele produces a warm and rich sound, ideal for various music styles.",
    features: [
      "Body - Mahogany",
      "Neck - Mahogany",
      "Fretboard - Rosewood",
      "Bridge - Rosewood",
      "Finish - Glossy Natural"
    ],
    stock: 25,
    sku: "AU-005",
    videoUrl: "https://youtu.be/uWnGy8x_a8A?si=KvMw9hEwibjpzoR4",
    additionalImages: [
      "assets/ASU1.jpg",
      "assets/ASU2.jpg",
      "assets/ASU3.jpg",
      "assets/ASU4.jpg"
    ]
  },
  {
    id: 6,
    name: "Anusswar's Guitalele",
    price: 15000,
    image: "assets/ASGll1.jpg",
    category: "Guitalele",
    description: "Anusswar's Guitalele is a versatile instrument that combines the features of a guitar and ukulele. It has a compact size, making it easy to carry around. The guitalele produces a bright and clear sound, suitable for various music genres.",
    features: [
      "Body - Mahogany",
      "Neck - Mahogany",
      "Fretboard - Rosewood",
      "Bridge - Rosewood",
      "Finish - Glossy Natural"
    ],
    stock: 5,
    sku: "AGll-005",
    videoUrl: "https://youtu.be/rSWyKF5B8CI?si=6HIVMz61cT5Q9ZWh",
    additionalImages: [
      "assets/ASGll1.jpg",
      "assets/ASGll2.jpg",
      "assets/ASGll3.jpg",
      "assets/ASGll4.jpg"
    ]
  },
  {
    id: 7,
    name: "Anusswar's Travel Size Acoustic Guitar",
    price: 13999,
    image: "assets/ATSAG.jpg",
    category: "Guitar",
    description: "Anusswar's Travel Size Acoustic Guitar is a compact and lightweight guitar designed for musicians on the move. It features a solid wood body, steel strings, and a beautiful finish, making it perfect for both beginners and experienced players.",
    features: [
      "Body - Teak Wood",
      "Neck - Mahogany",
      "Fretboard - Rosewood",
      "Bridge - Rosewood",
      "Finish - Glossy Natural"
    ],
    stock: 2,
    sku: "ATSAG-007",
    videoUrl: "https://youtu.be/rSWyKF5B8CI?si=BfDIOj7II4JF47Xj",
    additionalImages: [
      "assets/ATSAG.jpg",
    ]
  },
  {
    id: 8,
    name: "Ausswar Mini Classical Guitar (White Edition)",
    price: 9999,
    image: "assets/AMCGW.jpg",
    category: "Guitar",
    description: "Ausswar Mini Classical Guitar is a compact and portable guitar designed for musicians on the go. It features a solid wood body, nylon strings, and a beautiful finish, making it perfect for both beginners and experienced players.",
    features: [
      "Scale Length - 17inches",
      "Total Length - 29inches",
      "Nut Width - 48 mm",
      "Body Depth - 2.9inches",
      "Body length - 12.5inches",
      "Body - Laminated Teak Wood",
      "Neck - Mahogany Wood",
      "Fretboard - Rosewood",
      "Bridge - Rosewood "
    ],
    stock: 4,
    sku: "AMCGW-001",
    videoUrl: "https://youtu.be/jdlqcAAuZeA?si=kpDRZGsoTq6MI2aJ",
    additionalImages: [
      "assets/AMCGW.jpg",
    ]

  },
  {
    id: 9,
    name: "Anusswar's Vintage Edition Ukulele",
    price: 15500,
    image: "assets/AVEU.jpg",
    category: "Ukulele",
    description: "Anusswar's Ukulele is a beautifully crafted instrument made from high-quality wood. It features a soprano size, making it perfect for beginners and experienced players alike. The ukulele produces a warm and rich sound, ideal for various music styles.",
    features: [
      "Body - Mahogany",
      "Neck - Mahogany",
      "Fretboard - Rosewood",
      "Bridge - Rosewood",
      "Finish - Glossy Natural"
    ],
    stock: 1,
    sku: "AVEU-009",
    videoUrl: "https://youtu.be/jdlqcAAuZeA?si=C-WGPYbztNrdpxtS",
    additionalImages: [
      "assets/AVEU.jpg",
      "assets/AVEU2.jpg",
    ]
  }
];

// Function to check if a product already exists in the database
const checkProductExists = async (sku) => {
  try {
    const q = query(collection(db, "products"), where("sku", "==", sku));
    const querySnapshot = await getDocs(q);
    return !querySnapshot.empty;
  } catch (error) {
    console.error(`Error checking if product ${sku} exists:`, error);
    return false;
  }
};

// Function to add a single product to Firestore
const addProduct = async (product) => {
  try {
    // Check if product already exists
    const exists = await checkProductExists(product.sku);
    
    if (exists) {
      console.log(`Product with SKU ${product.sku} already exists. Skipping...`);
      return;
    }
    
    // Add product to Firestore
    const docRef = await addDoc(collection(db, "products"), product);
    console.log(`Product ${product.name} added with ID: ${docRef.id}`);
    return docRef;
  } catch (error) {
    console.error(`Error adding product ${product.name}:`, error);
  }
};

// Function to add all products to Firestore
const addAllProducts = async () => {
  console.log("Starting to add products to Firestore...");
  
  for (const product of productsData) {
    await addProduct(product);
  }
  
  console.log("Finished adding products to Firestore!");
};

// Export the function to add all products
export { addAllProducts };