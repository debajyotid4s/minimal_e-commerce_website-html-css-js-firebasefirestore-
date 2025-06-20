import anusswar from './anusswar.jpg';
import ASCG from './ASCG.jpg';
import ASCG2 from './ASCG2.jpg';
import ASCG3 from './ASCG3.jpg';
import ASCG4 from './ASCG4.jpg';
import ASCG5 from './ASCG5.jpg';
import ASCG6 from './ASCG6.jpg';
import ASGll1 from './ASGll1.jpg';
import ASGll2 from './ASGll2.jpg';
import ASGll3 from './ASGll3.jpg';
import ASGll4 from './ASGll4.jpg';
import ASPen1 from './ASPen1.jpg';
import ASPen2 from './ASPen2.jpg';
import ASPen3 from './ASPen3.jpg';
import ASS1 from './ASS1.jpg';
import ASS2 from './ASS2.jpg';
import ASS3 from './ASS3.jpg';
import ASS4 from './ASS4.jpg';
import ASU1 from './ASU1.jpg';
import ASU2 from './ASU2.jpg';
import ASU3 from './ASU3.jpg';
import ASU4 from './ASU4.jpg';
import AWP1 from './AWP1.jpg';
import AWP2 from './AWP2.jpg';
import guitar1 from './guitar1.png';    
import pick from './pick.png';
import guitar2 from './guitar2.png';
import ukulele from './ukulele.png';


export const assets = {
    anusswar,
    ASCG,
    ASCG2,
    ASCG3,
    ASCG4,
    ASCG5,
    ASCG6,
    ASGll1,
    ASGll2,
    ASGll3,
    ASGll4,
    ASPen1,
    ASPen2,
    ASPen3,
    ASS1,
    ASS2,
    ASS3,
    ASS4,
    ASU1,
    ASU2,
    ASU3,
    ASU4,
    AWP1,
    AWP2,
    guitar1,
    pick,
    guitar2,
    ukulele
}
export const products = [
    {
        _id: '1',
        name: "Anusswar Wooden Pick",
        description: "A beautifully crafted wooden pick for your guitar.",
        price: 190,
        image: [AWP1, AWP2],
        category: 'Accessories',
        stock: 100,
        bestseller: true
    },
    {
        _id: '2',
        name: "Anusswar Special Pendent",
        description: "A unique pendant that showcases the beauty of craftsmanship.",
        price: 250,
        image: [ASPen1, ASPen2, ASPen3],
        category: 'Accessories',
        stock: 99,
        bestseller: true
    },
    {
        _id: '3',
        name: "Anusswar Special Classical Guitar",
        description: "A premium classical guitar with a rich sound.",
        price: 15000,
        image: [ASCG, ASCG2, ASCG3, ASCG4, ASCG5, ASCG6],
        category: 'Guitars',
        stock: 13,
        bestseller: true
    },
    {
        _id: '4',
        name: "Anusswar Special Guitalele",
        description: "A versatile guitalele that combines the features of a guitar and ukulele.",
        price: 12000,
        image: [ASGll1, ASGll2, ASGll3, ASGll4],
        category: 'Guitaleles',
        stock: 10,
        bestseller: true
    },
    {
        _id: '5',
        name: "Anusswar Special Sandhi",
        description: "A traditional Bengali instrument that brings a unique sound to your music.",
        price: 19000,
        image: [ASS1, ASS2, ASS3, ASS4],
        category: 'Sandhis',
        stock: 10,
        bestseller: true
    },
    {
        _id: '6',
        name: "Anusswar Sepcial Ukulele",
        description: "A beautifully crafted ukulele with a warm tone.",
        price: 8000,
    
        image: [ASU1, ASU2, ASU3, ASU4],
        category: 'Ukuleles',
        stock: 33,
        bestseller: true
    }
]