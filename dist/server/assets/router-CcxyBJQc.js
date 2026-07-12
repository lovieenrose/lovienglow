import { createRootRoute, HeadContent, Scripts, createFileRoute, lazyRouteComponent, createRouter } from "@tanstack/react-router";
import { jsxs, jsx, Fragment } from "react/jsx-runtime";
import { Search, X, ShoppingCart, Check, Minus, Plus, ImagePlus, UploadCloud, Loader2 } from "lucide-react";
import { useState, createContext, useContext, useRef } from "react";
const categories = [
  "All",
  "GLP-1 Complete Set",
  "GLP-1 Duo Set",
  "Single Peptides",
  "Skinboosters",
  "Liquid Blends",
  "Topicals",
  "Other Supplies",
  "Waters"
];
const formatPrice = (price) => new Intl.NumberFormat("en-PH", {
  style: "currency",
  currency: "PHP",
  minimumFractionDigits: 2
}).format(price);
const completeSetIncluded = ["Peptide vial", "Bacteriostatic water", "Essentials"];
const duoSetIncluded = ["Peptide vial", "Bacteriostatic water"];
const products = [
  {
    id: 1,
    slug: "tirzepatide-15mg-complete-set",
    name: "Tirzepatide 15 mg Set",
    category: "GLP-1 Complete Set",
    shortCategory: "Complete set",
    description: "A complete GLP-1 set with Tirzepatide 15 mg, bacteriostatic water, and essentials gathered into one simple kit.",
    shortDescription: "Tirzepatide 15 mg with bac water and essentials.",
    price: 1499,
    stock: 24,
    rating: 4.9,
    reviews: 128,
    isBestSeller: true,
    strength: ["15 mg"],
    benefits: ["Complete coordinated set", "Includes bac water", "Includes essentials"],
    included: completeSetIncluded,
    palette: ["#f3a9be", "#8c2847", "#fff4f7"],
    form: "set"
  },
  {
    id: 2,
    slug: "tirzepatide-30mg-complete-set",
    name: "Tirzepatide 30 mg Set",
    category: "GLP-1 Complete Set",
    shortCategory: "Complete set",
    description: "A complete GLP-1 set with Tirzepatide 30 mg, bacteriostatic water, and essentials for a neatly bundled routine.",
    shortDescription: "Tirzepatide 30 mg with bac water and essentials.",
    price: 1699,
    stock: 18,
    rating: 4.9,
    reviews: 112,
    isBestSeller: true,
    strength: ["30 mg"],
    benefits: ["Complete coordinated set", "Includes bac water", "Includes essentials"],
    included: completeSetIncluded,
    palette: ["#e8b9d6", "#6f315f", "#fff7fc"],
    form: "set"
  },
  {
    id: 3,
    slug: "retatrutide-10mg-complete-set",
    name: "Retatrutide 10 mg Set",
    category: "GLP-1 Complete Set",
    shortCategory: "Complete set",
    description: "A complete GLP-1 set with Retatrutide 10 mg, bacteriostatic water, and preparation essentials.",
    shortDescription: "Retatrutide 10 mg with bac water and essentials.",
    price: 1499,
    stock: 20,
    rating: 4.8,
    reviews: 89,
    isNew: true,
    strength: ["10 mg"],
    benefits: ["Complete coordinated set", "Includes bac water", "Includes essentials"],
    included: completeSetIncluded,
    palette: ["#f2b7a8", "#a24a3b", "#fff5ef"],
    form: "set"
  },
  {
    id: 4,
    slug: "retatrutide-20mg-complete-set",
    name: "Retatrutide 20 mg Set",
    category: "GLP-1 Complete Set",
    shortCategory: "Complete set",
    description: "A complete GLP-1 set with Retatrutide 20 mg, bacteriostatic water, and essentials in one bundled format.",
    shortDescription: "Retatrutide 20 mg with bac water and essentials.",
    price: 1999,
    stock: 12,
    rating: 4.9,
    reviews: 77,
    isBestSeller: true,
    strength: ["20 mg"],
    benefits: ["Complete coordinated set", "Includes bac water", "Includes essentials"],
    included: completeSetIncluded,
    palette: ["#d9c4e8", "#6c4a81", "#fbf7ff"],
    form: "set"
  },
  {
    id: 5,
    slug: "tirzepatide-15mg-duo-set",
    name: "Tirzepatide 15 mg Duo Set",
    category: "GLP-1 Duo Set",
    shortCategory: "Duo set",
    description: "A focused duo set pairing Tirzepatide 15 mg with bacteriostatic water.",
    shortDescription: "Tirzepatide 15 mg paired with bac water.",
    price: 1399,
    stock: 24,
    rating: 4.8,
    reviews: 94,
    isBestSeller: true,
    strength: ["15 mg"],
    benefits: ["Two-piece format", "Includes bac water", "Streamlined kit"],
    included: duoSetIncluded,
    palette: ["#f0aaa7", "#8c3f44", "#fff4f2"],
    form: "set"
  },
  {
    id: 6,
    slug: "tirzepatide-30mg-duo-set",
    name: "Tirzepatide 30 mg Duo Set",
    category: "GLP-1 Duo Set",
    shortCategory: "Duo set",
    description: "A focused duo set pairing Tirzepatide 30 mg with bacteriostatic water.",
    shortDescription: "Tirzepatide 30 mg paired with bac water.",
    price: 1599,
    stock: 20,
    rating: 4.8,
    reviews: 82,
    strength: ["30 mg"],
    benefits: ["Two-piece format", "Includes bac water", "Streamlined kit"],
    included: duoSetIncluded,
    palette: ["#b9ddea", "#2f7389", "#f2fbff"],
    form: "set"
  },
  {
    id: 7,
    slug: "retatrutide-10mg-duo-set",
    name: "Retatrutide 10 mg Duo Set",
    category: "GLP-1 Duo Set",
    shortCategory: "Duo set",
    description: "A focused duo set pairing Retatrutide 10 mg with bacteriostatic water.",
    shortDescription: "Retatrutide 10 mg paired with bac water.",
    price: 1399,
    stock: 18,
    rating: 4.8,
    reviews: 69,
    isNew: true,
    strength: ["10 mg"],
    benefits: ["Two-piece format", "Includes bac water", "Streamlined kit"],
    included: duoSetIncluded,
    palette: ["#f5c0b1", "#934d3c", "#fff6f1"],
    form: "set"
  },
  {
    id: 8,
    slug: "retatrutide-20mg-duo-set",
    name: "Retatrutide 20 mg Duo Set",
    category: "GLP-1 Duo Set",
    shortCategory: "Duo set",
    description: "A focused duo set pairing Retatrutide 20 mg with bacteriostatic water.",
    shortDescription: "Retatrutide 20 mg paired with bac water.",
    price: 1899,
    stock: 11,
    rating: 4.9,
    reviews: 63,
    isBestSeller: true,
    strength: ["20 mg"],
    benefits: ["Two-piece format", "Includes bac water", "Streamlined kit"],
    included: duoSetIncluded,
    palette: ["#eadbd2", "#806458", "#fffaf6"],
    form: "set"
  },
  {
    id: 9,
    slug: "dsip-5mg",
    name: "DSIP 5 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "A single peptide vial format for customers building their own focused routine.",
    shortDescription: "Single vial format, vial only.",
    price: 900,
    stock: 30,
    rating: 4.7,
    reviews: 41,
    strength: ["5 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#efb8c8", "#8e3857", "#fff5f8"],
    form: "vial"
  },
  {
    id: 10,
    slug: "ghk-cu-50mg",
    name: "GHK-Cu 50 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "A single GHK-Cu peptide vial in a clearly labeled, vial-only format.",
    shortDescription: "Single GHK-Cu vial, vial only.",
    price: 1099,
    stock: 28,
    rating: 4.8,
    reviews: 52,
    strength: ["50 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#c2d7ef", "#355c86", "#f3f8ff"],
    form: "vial"
  },
  {
    id: 11,
    slug: "kpv-10mg",
    name: "KPV 10 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "A single KPV peptide vial for a focused, vial-only order.",
    shortDescription: "Single KPV vial, vial only.",
    price: 1099,
    stock: 28,
    rating: 4.7,
    reviews: 37,
    strength: ["10 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#f4c3ce", "#9a3851", "#fff2f5"],
    form: "vial"
  },
  {
    id: 12,
    slug: "fuan-glutathione-1500mg",
    name: "FUAN Glutathione 1500 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "FUAN Glutathione in a 1500 mg single-vial format.",
    shortDescription: "FUAN Glutathione 1500 mg, vial only.",
    price: 1299,
    stock: 22,
    rating: 4.8,
    reviews: 46,
    isNew: true,
    strength: ["1500 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#d6e3c5", "#50723c", "#f8fff0"],
    form: "vial"
  },
  {
    id: 13,
    slug: "korean-glutaone-1200mg",
    name: "KOREAN Glutaone 1200 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "KOREAN Glutaone in a 1200 mg single-vial format.",
    shortDescription: "KOREAN Glutaone 1200 mg, vial only.",
    price: 550,
    stock: 32,
    rating: 4.7,
    reviews: 44,
    strength: ["1200 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#f0d6a8", "#836020", "#fff9ec"],
    form: "vial"
  },
  {
    id: 14,
    slug: "tirzepatide-15mg",
    name: "Tirzepatide 15 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "Tirzepatide 15 mg in a single-vial, vial-only format.",
    shortDescription: "Tirzepatide 15 mg, vial only.",
    price: 1299,
    stock: 26,
    rating: 4.8,
    reviews: 72,
    isBestSeller: true,
    strength: ["15 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#f2c6bc", "#894331", "#fff7f3"],
    form: "vial"
  },
  {
    id: 15,
    slug: "tirzepatide-30mg",
    name: "Tirzepatide 30 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "Tirzepatide 30 mg in a single-vial, vial-only format.",
    shortDescription: "Tirzepatide 30 mg, vial only.",
    price: 1499,
    stock: 24,
    rating: 4.9,
    reviews: 81,
    isBestSeller: true,
    strength: ["30 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#f6ced7", "#8e3150", "#fff5f8"],
    form: "vial"
  },
  {
    id: 16,
    slug: "retatrutide-10mg",
    name: "Retatrutide 10 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "Retatrutide 10 mg in a single-vial, vial-only format.",
    shortDescription: "Retatrutide 10 mg, vial only.",
    price: 1299,
    stock: 22,
    rating: 4.8,
    reviews: 59,
    strength: ["10 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#ded2ef", "#5d4a81", "#fbf8ff"],
    form: "vial"
  },
  {
    id: 17,
    slug: "retatrutide-20mg",
    name: "Retatrutide 20 mg",
    category: "Single Peptides",
    shortCategory: "Single peptide",
    description: "Retatrutide 20 mg in a single-vial, vial-only format.",
    shortDescription: "Retatrutide 20 mg, vial only.",
    price: 1799,
    stock: 16,
    rating: 4.9,
    reviews: 61,
    isBestSeller: true,
    strength: ["20 mg"],
    benefits: ["Vial-only format", "Clearly labeled", "Easy to add to a custom order"],
    palette: ["#c7e6dc", "#2d7664", "#f2fffb"],
    form: "vial"
  },
  {
    id: 18,
    slug: "pink-hya-5ml",
    name: "Pink HYA 5 ml",
    category: "Skinboosters",
    shortCategory: "Skinbooster",
    description: "Pink HYA skinbooster in a 5 ml bottle format.",
    shortDescription: "Pink HYA skinbooster, 5 ml.",
    price: 750,
    stock: 34,
    rating: 4.8,
    reviews: 48,
    isBestSeller: true,
    strength: ["5 ml"],
    benefits: ["5 ml bottle", "Glow-focused option", "Easy to pair with a routine"],
    palette: ["#f4c3ce", "#9a3851", "#fff2f5"],
    form: "bottle"
  },
  {
    id: 19,
    slug: "ghk-cu-hya-5ml",
    name: "GHK-Cu HYA 5 ml",
    category: "Skinboosters",
    shortCategory: "Skinbooster",
    description: "GHK-Cu HYA skinbooster in a 5 ml bottle format.",
    shortDescription: "GHK-Cu HYA skinbooster, 5 ml.",
    price: 750,
    stock: 34,
    rating: 4.8,
    reviews: 43,
    strength: ["5 ml"],
    benefits: ["5 ml bottle", "Glow-focused option", "Easy to pair with a routine"],
    palette: ["#b9ddea", "#2f7389", "#f2fbff"],
    form: "bottle"
  },
  {
    id: 20,
    slug: "pdrn-5ml",
    name: "PDRN 5 ml",
    category: "Skinboosters",
    shortCategory: "Skinbooster",
    description: "PDRN skinbooster in a 5 ml bottle format.",
    shortDescription: "PDRN skinbooster, 5 ml.",
    price: 750,
    stock: 34,
    rating: 4.8,
    reviews: 40,
    strength: ["5 ml"],
    benefits: ["5 ml bottle", "Glow-focused option", "Easy to pair with a routine"],
    palette: ["#eadbd2", "#806458", "#fffaf6"],
    form: "bottle"
  },
  {
    id: 21,
    slug: "recombinant-collagen-5ml",
    name: "Recombinant Collagen 5 ml",
    category: "Skinboosters",
    shortCategory: "Skinbooster",
    description: "Recombinant Collagen skinbooster in a 5 ml bottle format.",
    shortDescription: "Recombinant Collagen skinbooster, 5 ml.",
    price: 750,
    stock: 34,
    rating: 4.7,
    reviews: 36,
    strength: ["5 ml"],
    benefits: ["5 ml bottle", "Glow-focused option", "Easy to pair with a routine"],
    palette: ["#f0d6a8", "#836020", "#fff9ec"],
    form: "bottle"
  },
  {
    id: 22,
    slug: "whitening-spot-fading-5ml",
    name: "Whitening and Spot Fading 5 ml",
    category: "Skinboosters",
    shortCategory: "Skinbooster",
    description: "Whitening and Spot Fading skinbooster in a 5 ml bottle format.",
    shortDescription: "Whitening and Spot Fading skinbooster, 5 ml.",
    price: 750,
    stock: 34,
    rating: 4.7,
    reviews: 35,
    strength: ["5 ml"],
    benefits: ["5 ml bottle", "Glow-focused option", "Easy to pair with a routine"],
    palette: ["#d6e3c5", "#50723c", "#f8fff0"],
    form: "bottle"
  },
  {
    id: 23,
    slug: "lemon-bottle-plus-10ml",
    name: "Lemon Bottle Plus 10 ml",
    category: "Liquid Blends",
    shortCategory: "Liquid blend",
    description: "Lemon Bottle Plus in a 10 ml liquid blend format.",
    shortDescription: "Liquid blend format, 10 ml.",
    price: 1200,
    stock: 18,
    rating: 4.8,
    reviews: 39,
    isNew: true,
    strength: ["10 ml"],
    benefits: ["10 ml bottle", "Liquid blend format", "Easy to add to a custom order"],
    palette: ["#f1df8e", "#786c1f", "#fffbe3"],
    form: "bottle"
  },
  {
    id: 24,
    slug: "ghk-cu-1g-topical",
    name: "GHK-Cu 1 g",
    category: "Topicals",
    shortCategory: "Topical",
    description: "GHK-Cu topical format in a 1 g size.",
    shortDescription: "Topical format, 1 g.",
    price: 1e3,
    stock: 20,
    rating: 4.8,
    reviews: 45,
    isBestSeller: true,
    strength: ["1 g"],
    benefits: ["Topical format", "Clearly labeled", "Compact size"],
    palette: ["#c2d7ef", "#355c86", "#f3f8ff"],
    form: "jar"
  },
  {
    id: 25,
    slug: "pdrn-salmon-dna-1g",
    name: "PDRN Salmon DNA 1 g",
    category: "Topicals",
    shortCategory: "Topical",
    description: "PDRN Salmon DNA topical format in a 1 g size.",
    shortDescription: "PDRN Salmon DNA topical, 1 g.",
    price: 1250,
    stock: 18,
    rating: 4.8,
    reviews: 42,
    strength: ["1 g"],
    benefits: ["Topical format", "Clearly labeled", "Compact size"],
    palette: ["#f2c6bc", "#894331", "#fff7f3"],
    form: "jar"
  },
  {
    id: 26,
    slug: "snap-8-10mg",
    name: "Snap-8 10 mg",
    category: "Topicals",
    shortCategory: "Topical",
    description: "Snap-8 topical format in a 10 mg size.",
    shortDescription: "Snap-8 topical format, 10 mg.",
    price: 1100,
    stock: 19,
    rating: 4.7,
    reviews: 32,
    strength: ["10 mg"],
    benefits: ["Topical format", "Clearly labeled", "Compact size"],
    palette: ["#ded2ef", "#5d4a81", "#fbf8ff"],
    form: "jar"
  },
  {
    id: 27,
    slug: "recon-syringe-crd-3ml-23g-1-inch",
    name: "Recon Syringe CRD 3mL 23G x 1 inch",
    category: "Other Supplies",
    shortCategory: "Supply",
    description: "Recon Syringe CRD 3mL 23G x 1 inch, sold per piece.",
    shortDescription: "Recon syringe, 1 pc.",
    price: 10,
    stock: 200,
    rating: 4.8,
    reviews: 58,
    strength: ["1 pc"],
    benefits: ["Single piece", "Preparation supply", "Easy add-on"],
    palette: ["#f0aaa7", "#8c3f44", "#fff4f2"],
    form: "supply"
  },
  {
    id: 28,
    slug: "sg-insulin-syringe-29g-13mm",
    name: "SG Insulin Syringe 29G x 13mm",
    category: "Other Supplies",
    shortCategory: "Supply",
    description: "SG Insulin Syringe 29G x 13mm, sold per piece.",
    shortDescription: "Insulin syringe, 1 pc.",
    price: 10,
    stock: 200,
    rating: 4.8,
    reviews: 61,
    strength: ["1 pc"],
    benefits: ["Single piece", "Preparation supply", "Easy add-on"],
    palette: ["#b9ddea", "#2f7389", "#f2fbff"],
    form: "supply"
  },
  {
    id: 29,
    slug: "acetic-acid-water-5ml",
    name: "Acetic Acid Water 5 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Acetic Acid Water in a 5 ml format.",
    shortDescription: "Water format, 5 ml.",
    price: 120,
    stock: 80,
    rating: 4.8,
    reviews: 54,
    strength: ["5 ml"],
    benefits: ["Clearly labeled", "Compact format", "Easy add-on"],
    palette: ["#c7e6dc", "#2d7664", "#f2fffb"],
    form: "vial"
  },
  {
    id: 30,
    slug: "bac-water-3ml",
    name: "Bac Water 3 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Bacteriostatic water in a 3 ml format.",
    shortDescription: "Bacteriostatic water, 3 ml.",
    price: 120,
    stock: 90,
    rating: 4.9,
    reviews: 73,
    strength: ["3 ml"],
    benefits: ["Clearly labeled", "Compact format", "Easy add-on"],
    palette: ["#b9ddea", "#2f7389", "#f2fbff"],
    form: "vial"
  },
  {
    id: 31,
    slug: "bac-water-5ml",
    name: "Bac Water 5 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Bacteriostatic water in a 5 ml format.",
    shortDescription: "Bacteriostatic water, 5 ml.",
    price: 140,
    stock: 88,
    rating: 4.9,
    reviews: 71,
    strength: ["5 ml"],
    benefits: ["Clearly labeled", "Compact format", "Easy add-on"],
    palette: ["#c2d7ef", "#355c86", "#f3f8ff"],
    form: "vial"
  },
  {
    id: 32,
    slug: "bac-water-10ml",
    name: "Bac Water 10 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Bacteriostatic water in a 10 ml format.",
    shortDescription: "Bacteriostatic water, 10 ml.",
    price: 150,
    stock: 86,
    rating: 4.9,
    reviews: 75,
    isBestSeller: true,
    strength: ["10 ml"],
    benefits: ["Clearly labeled", "Compact format", "Easy add-on"],
    palette: ["#d6e3c5", "#50723c", "#f8fff0"],
    form: "vial"
  },
  {
    id: 33,
    slug: "pharma-bac-water-ampoule-10ml",
    name: "Pharma Bac Water Ampoule 10 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Pharma bacteriostatic water in a 10 ml ampoule format.",
    shortDescription: "Pharma bac water ampoule, 10 ml.",
    price: 150,
    stock: 70,
    rating: 4.8,
    reviews: 57,
    strength: ["10 ml"],
    benefits: ["Clearly labeled", "Ampoule format", "Easy add-on"],
    palette: ["#eadbd2", "#806458", "#fffaf6"],
    form: "vial"
  },
  {
    id: 34,
    slug: "pharma-bac-water-vial-10ml",
    name: "Pharma Bac Water Vial 10 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Pharma bacteriostatic water in a 10 ml vial format.",
    shortDescription: "Pharma bac water vial, 10 ml.",
    price: 160,
    stock: 70,
    rating: 4.8,
    reviews: 59,
    strength: ["10 ml"],
    benefits: ["Clearly labeled", "Vial format", "Easy add-on"],
    palette: ["#f2c6bc", "#894331", "#fff7f3"],
    form: "vial"
  },
  {
    id: 35,
    slug: "saline-water-15ml",
    name: "Saline Water 15 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Saline water in a 15 ml format.",
    shortDescription: "Saline water, 15 ml.",
    price: 45,
    stock: 100,
    rating: 4.8,
    reviews: 63,
    strength: ["15 ml"],
    benefits: ["Clearly labeled", "Compact format", "Easy add-on"],
    palette: ["#c7e6dc", "#2d7664", "#f2fffb"],
    form: "vial"
  },
  {
    id: 36,
    slug: "saline-water-100ml",
    name: "Saline Water 100 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Saline water in a 100 ml format.",
    shortDescription: "Saline water, 100 ml.",
    price: 150,
    stock: 76,
    rating: 4.8,
    reviews: 52,
    strength: ["100 ml"],
    benefits: ["Clearly labeled", "Larger format", "Easy add-on"],
    palette: ["#b9ddea", "#2f7389", "#f2fbff"],
    form: "bottle"
  },
  {
    id: 37,
    slug: "saline-water-500ml",
    name: "Saline Water 500 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Saline water in a 500 ml format.",
    shortDescription: "Saline water, 500 ml.",
    price: 170,
    stock: 64,
    rating: 4.8,
    reviews: 49,
    strength: ["500 ml"],
    benefits: ["Clearly labeled", "Larger format", "Easy add-on"],
    palette: ["#c2d7ef", "#355c86", "#f3f8ff"],
    form: "bottle"
  },
  {
    id: 38,
    slug: "sterile-water-for-inj-ampoule-5ml",
    name: "Sterile Water for Inj. Ampoule 5 ml",
    category: "Waters",
    shortCategory: "Water",
    description: "Sterile water for injection in a 5 ml ampoule format.",
    shortDescription: "Sterile water ampoule, 5 ml.",
    price: 35,
    stock: 120,
    rating: 4.8,
    reviews: 66,
    strength: ["5 ml"],
    benefits: ["Clearly labeled", "Ampoule format", "Easy add-on"],
    palette: ["#eadbd2", "#806458", "#fffaf6"],
    form: "vial"
  }
];
function ProductVisual({ product, compact = false }) {
  return /* @__PURE__ */ jsxs(
    "div",
    {
      className: `product-visual product-visual--${product.form} ${compact ? "product-visual--compact" : ""}`,
      style: { "--tone": product.palette[0], "--ink": product.palette[1], "--wash": product.palette[2] },
      "aria-label": `${product.name} product presentation`,
      role: "img",
      children: [
        /* @__PURE__ */ jsx("span", { className: "visual-orb visual-orb--one" }),
        /* @__PURE__ */ jsx("span", { className: "visual-orb visual-orb--two" }),
        /* @__PURE__ */ jsxs("div", { className: "product-object", children: [
          /* @__PURE__ */ jsx("span", { className: "product-cap" }),
          /* @__PURE__ */ jsxs("span", { className: "product-label", children: [
            /* @__PURE__ */ jsx("i", { children: "LG" }),
            /* @__PURE__ */ jsx("b", { children: product.name.split(" ")[0] }),
            /* @__PURE__ */ jsx("small", { children: product.shortCategory })
          ] })
        ] }),
        product.form === "set" && /* @__PURE__ */ jsxs("div", { className: "product-object product-object--secondary", children: [
          /* @__PURE__ */ jsx("span", { className: "product-cap" }),
          /* @__PURE__ */ jsxs("span", { className: "product-label", children: [
            /* @__PURE__ */ jsx("i", { children: "LG" }),
            /* @__PURE__ */ jsx("b", { children: "Pure" }),
            /* @__PURE__ */ jsx("small", { children: "bac water" })
          ] })
        ] }),
        product.form === "supply" && /* @__PURE__ */ jsxs("div", { className: "supply-card", children: [
          "ritual",
          /* @__PURE__ */ jsx("br", {}),
          "essentials"
        ] }),
        /* @__PURE__ */ jsx("span", { className: "visual-shadow" })
      ]
    }
  );
}
const emptyBuyer = { fullName: "", socialHandle: "", contactNumber: "", email: "", address: "" };
const ORDER_COUNTER_KEY = "lng_order_counter";
function generateReference() {
  const last = parseInt(localStorage.getItem(ORDER_COUNTER_KEY) ?? "0", 10);
  const next = last + 1;
  localStorage.setItem(ORDER_COUNTER_KEY, String(next));
  return `LNG-${String(next).padStart(6, "0")}`;
}
const StoreContext = createContext(null);
function StoreProvider({ children }) {
  const [cart, setCart] = useState({});
  const [cartOpen, setCartOpen] = useState(false);
  const [toast, setToast] = useState("");
  const [query, setQuery] = useState("");
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState(1);
  const [buyer, setBuyer] = useState(emptyBuyer);
  const [courier, setCourier] = useState("jnt");
  const [region, setRegion] = useState("luzon");
  const [paymentMethodId, setPaymentMethodId] = useState("");
  const [receiptFile, setReceiptFile] = useState(null);
  const [placingOrder, setPlacingOrder] = useState(false);
  const [lastOrder, setLastOrder] = useState(null);
  const [orderReference, setOrderReference] = useState(generateReference);
  const notify = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2200);
  };
  const addToCart = (id, quantity = 1) => {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + quantity }));
    notify("Added to cart");
  };
  const removeFromCart = (id) => {
    setCart((current) => {
      const next = { ...current };
      delete next[id];
      return next;
    });
  };
  const updateQuantity = (id, quantity) => {
    if (quantity < 1) return removeFromCart(id);
    setCart((current) => ({ ...current, [id]: quantity }));
  };
  const openCheckout = () => {
    setCartOpen(false);
    setCheckoutStep(1);
    setOrderReference(generateReference());
    setCheckoutOpen(true);
  };
  const closeCheckout = () => setCheckoutOpen(false);
  const goToStep = (step) => setCheckoutStep(step);
  const setBuyerField = (field, value) => setBuyer((current) => ({ ...current, [field]: value }));
  const placeOrder = async () => {
    if (!receiptFile) return null;
    setPlacingOrder(true);
    const lines = Object.entries(cart).map(([id, quantity]) => {
      const product = products.find((item) => item.id === Number(id));
      return { productId: product.id, name: product.name, price: product.price, quantity };
    });
    const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);
    const shippingFee = courier === "lalamove" ? 0 : region === "visayas" ? 180 : region === "mindanao" ? 200 : 120;
    const order = {
      reference: orderReference,
      placedAt: (/* @__PURE__ */ new Date()).toISOString(),
      lines,
      subtotal,
      shippingFee,
      total: subtotal + shippingFee,
      buyer,
      courier,
      region,
      paymentMethod: paymentMethodId,
      receiptName: receiptFile.name
    };
    await new Promise((resolve) => setTimeout(resolve, 900));
    setLastOrder(order);
    setCart({});
    setPlacingOrder(false);
    return order;
  };
  const startNewOrder = () => {
    setLastOrder(null);
    setBuyer(emptyBuyer);
    setCourier("jnt");
    setRegion("luzon");
    setPaymentMethodId("");
    setReceiptFile(null);
    setCheckoutStep(1);
    setOrderReference(generateReference());
    setCheckoutOpen(false);
  };
  return /* @__PURE__ */ jsx(
    StoreContext.Provider,
    {
      value: {
        cart,
        cartOpen,
        toast,
        query,
        setQuery,
        addToCart,
        removeFromCart,
        updateQuantity,
        setCartOpen,
        checkoutOpen,
        checkoutStep,
        openCheckout,
        closeCheckout,
        goToStep,
        buyer,
        setBuyerField,
        courier,
        setCourier,
        region,
        setRegion,
        paymentMethodId,
        setPaymentMethodId,
        receiptFile,
        setReceiptFile,
        orderReference,
        placingOrder,
        lastOrder,
        placeOrder,
        startNewOrder
      },
      children
    }
  );
}
function useStore() {
  const context = useContext(StoreContext);
  if (!context) throw new Error("useStore must be used inside StoreProvider");
  return context;
}
function Header() {
  const { cart, setCartOpen, query, setQuery } = useStore();
  const itemCount = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  return /* @__PURE__ */ jsxs(Fragment, { children: [
    /* @__PURE__ */ jsx("div", { className: "announcement", children: "Premium peptides, skinboosters & research supplies — all in one shop." }),
    /* @__PURE__ */ jsxs("header", { className: "site-header", children: [
      /* @__PURE__ */ jsx("a", { href: "#top", className: "logo-link", "aria-label": "Go to shop home", children: /* @__PURE__ */ jsx("img", { src: "/lovieNglow-logo-banner.png", alt: "LovieNGlow", className: "site-logo" }) }),
      /* @__PURE__ */ jsxs("div", { className: "header-search", children: [
        /* @__PURE__ */ jsx(Search, { size: 15 }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: query,
            onChange: (event) => setQuery(event.target.value),
            placeholder: "Search products…",
            "aria-label": "Search products"
          }
        ),
        query && /* @__PURE__ */ jsx("button", { onClick: () => setQuery(""), "aria-label": "Clear search", children: /* @__PURE__ */ jsx(X, { size: 14 }) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "header-actions", children: /* @__PURE__ */ jsxs(
        "button",
        {
          className: "icon-button badge-button",
          onClick: () => setCartOpen(true),
          "aria-label": `Shopping cart — ${itemCount} item${itemCount !== 1 ? "s" : ""}`,
          id: "cart-button",
          children: [
            /* @__PURE__ */ jsx(ShoppingCart, { size: 20 }),
            itemCount > 0 && /* @__PURE__ */ jsx("span", { children: itemCount })
          ]
        }
      ) })
    ] })
  ] });
}
function CartDrawer() {
  const { cart, cartOpen, setCartOpen, updateQuantity, removeFromCart, openCheckout } = useStore();
  const lines = Object.entries(cart).map(([id, quantity]) => ({
    product: products.find((item) => item.id === Number(id)),
    quantity
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return /* @__PURE__ */ jsxs("div", { className: `drawer-layer ${cartOpen ? "drawer-layer--open" : ""}`, "aria-hidden": !cartOpen, children: [
    /* @__PURE__ */ jsx("button", { className: "drawer-backdrop", onClick: () => setCartOpen(false), "aria-label": "Close cart" }),
    /* @__PURE__ */ jsxs("aside", { className: "cart-drawer", role: "dialog", "aria-label": "Shopping cart", children: [
      /* @__PURE__ */ jsxs("div", { className: "drawer-header", children: [
        /* @__PURE__ */ jsxs("div", { children: [
          /* @__PURE__ */ jsx("h2", { children: "Your Cart" }),
          lines.length > 0 && /* @__PURE__ */ jsxs("span", { className: "cart-count", children: [
            lines.length,
            " item",
            lines.length !== 1 ? "s" : ""
          ] })
        ] }),
        /* @__PURE__ */ jsx("button", { className: "icon-button", onClick: () => setCartOpen(false), "aria-label": "Close cart", children: /* @__PURE__ */ jsx(X, { size: 20 }) })
      ] }),
      lines.length === 0 ? /* @__PURE__ */ jsxs("div", { className: "empty-cart", children: [
        /* @__PURE__ */ jsx(ShoppingCart, { size: 36, strokeWidth: 1.3 }),
        /* @__PURE__ */ jsx("h3", { children: "Your cart is empty" }),
        /* @__PURE__ */ jsx("p", { children: "Add products to your cart to get started." }),
        /* @__PURE__ */ jsx("button", { className: "button button--dark", onClick: () => setCartOpen(false), children: "Continue Shopping" })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "cart-lines", children: lines.map(({ product, quantity }) => /* @__PURE__ */ jsxs("div", { className: "cart-line", children: [
          /* @__PURE__ */ jsx(ProductVisual, { product, compact: true }),
          /* @__PURE__ */ jsxs("div", { className: "cart-line__info", children: [
            /* @__PURE__ */ jsx("h3", { children: product.name }),
            /* @__PURE__ */ jsx("p", { className: "cart-line__variant", children: product.strength[0] }),
            /* @__PURE__ */ jsxs("p", { className: "cart-line__unit-price", children: [
              formatPrice(product.price),
              " each"
            ] }),
            /* @__PURE__ */ jsxs("div", { className: "quantity", children: [
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => updateQuantity(product.id, quantity - 1),
                  "aria-label": "Decrease quantity",
                  children: "−"
                }
              ),
              /* @__PURE__ */ jsx("span", { children: quantity }),
              /* @__PURE__ */ jsx(
                "button",
                {
                  onClick: () => updateQuantity(product.id, quantity + 1),
                  "aria-label": "Increase quantity",
                  children: "+"
                }
              )
            ] })
          ] }),
          /* @__PURE__ */ jsxs("div", { className: "cart-price", children: [
            /* @__PURE__ */ jsx("b", { children: formatPrice(product.price * quantity) }),
            /* @__PURE__ */ jsx("button", { onClick: () => removeFromCart(product.id), "aria-label": `Remove ${product.name}`, children: "Remove" })
          ] })
        ] }, product.id)) }),
        /* @__PURE__ */ jsxs("div", { className: "cart-footer", children: [
          /* @__PURE__ */ jsxs("div", { className: "cart-subtotal", children: [
            /* @__PURE__ */ jsx("span", { children: "Subtotal" }),
            /* @__PURE__ */ jsx("b", { children: formatPrice(subtotal) })
          ] }),
          /* @__PURE__ */ jsx("p", { className: "cart-shipping-note", children: "Shipping calculated at checkout." }),
          /* @__PURE__ */ jsx("button", { className: "button button--dark button--wide", onClick: openCheckout, id: "checkout-button", children: "Checkout" })
        ] })
      ] })
    ] })
  ] });
}
function Footer() {
  return /* @__PURE__ */ jsxs("footer", { className: "site-footer", children: [
    /* @__PURE__ */ jsxs("div", { className: "footer-brand", children: [
      /* @__PURE__ */ jsx("img", { src: "/lovieNglow-logo-banner.png", alt: "LovieNGlow", className: "site-logo site-logo--footer" }),
      /* @__PURE__ */ jsx("p", { className: "footer-tagline", children: "Premium peptides, skinboosters & research supplies." })
    ] }),
    /* @__PURE__ */ jsxs("nav", { className: "footer-links", "aria-label": "Footer navigation", children: [
      /* @__PURE__ */ jsx("a", { href: "mailto:lovin.glow.ph@gmail.com", children: "Contact" }),
      /* @__PURE__ */ jsx("a", { href: "#top", children: "Shipping & Returns" }),
      /* @__PURE__ */ jsx("a", { href: "#top", children: "Privacy Policy" }),
      /* @__PURE__ */ jsx("a", { href: "#top", children: "Terms & Conditions" })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "footer-right", children: [
      /* @__PURE__ */ jsxs("div", { className: "footer-social", children: [
        /* @__PURE__ */ jsx("a", { href: "#top", "aria-label": "Instagram", className: "social-link", children: /* @__PURE__ */ jsxs("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: [
          /* @__PURE__ */ jsx("rect", { x: "2", y: "2", width: "20", height: "20", rx: "5", ry: "5" }),
          /* @__PURE__ */ jsx("path", { d: "M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" }),
          /* @__PURE__ */ jsx("line", { x1: "17.5", y1: "6.5", x2: "17.51", y2: "6.5" })
        ] }) }),
        /* @__PURE__ */ jsx("a", { href: "#top", "aria-label": "TikTok", className: "social-link", children: /* @__PURE__ */ jsx("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.8", strokeLinecap: "round", strokeLinejoin: "round", children: /* @__PURE__ */ jsx("path", { d: "M9 12a4 4 0 1 0 4 4V4a5 5 0 0 0 5 5" }) }) })
      ] }),
      /* @__PURE__ */ jsx("small", { className: "footer-copy", children: "© 2026 LovieNGlow. For research and wellness education only. Always consult a qualified professional." })
    ] })
  ] });
}
function Toast() {
  const { toast } = useStore();
  return /* @__PURE__ */ jsxs("div", { className: `toast ${toast ? "toast--visible" : ""}`, role: "status", "aria-live": "polite", children: [
    /* @__PURE__ */ jsx(Check, { size: 14 }),
    toast
  ] });
}
const paymentMethods = [
  { id: "gcash", label: "GCash", type: "ewallet", accountName: "Lovie N Glow", accountNumber: "0917 000 0000", qrImage: "/payments/gcash.png", note: "Scan the QR or send to the number above." },
  { id: "maya", label: "Maya", type: "ewallet", accountName: "Lovie N Glow", accountNumber: "0917 000 0000", qrImage: "/payments/maya.png", note: "Scan the QR or send to the number above." },
  { id: "bdo", label: "BDO", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "BDO Savings Account." },
  { id: "bpi", label: "BPI", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "BPI Savings Account." },
  { id: "gotyme", label: "GoTyme", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "GoTyme Save Up Account." },
  { id: "maribank", label: "Maribank", type: "bank", accountName: "Lovie N Glow", accountNumber: "0000 0000 0000", note: "Maribank Savings Account." }
];
const couriers = [
  { id: "jnt", label: "J&T Express", note: "Nationwide delivery" },
  { id: "lalamove", label: "Lalamove", note: "Metro Manila only" }
];
const shippingRegions = [
  { id: "luzon", label: "Luzon", fee: 120 },
  { id: "visayas", label: "Visayas", fee: 180 },
  { id: "mindanao", label: "Mindanao", fee: 200 }
];
const steps = [
  { number: 1, label: "Order" },
  { number: 2, label: "Shipping Details" },
  { number: 3, label: "Payment" }
];
function CheckoutModal() {
  const { checkoutOpen, checkoutStep, closeCheckout, goToStep, lastOrder, startNewOrder } = useStore();
  if (!checkoutOpen) return null;
  return /* @__PURE__ */ jsxs("div", { className: "modal-layer checkout-layer", "aria-hidden": !checkoutOpen, children: [
    /* @__PURE__ */ jsx("button", { className: "modal-backdrop", onClick: closeCheckout, "aria-label": "Close checkout" }),
    /* @__PURE__ */ jsxs("div", { className: "checkout-modal", role: "dialog", "aria-label": "Checkout", children: [
      /* @__PURE__ */ jsx("button", { className: "modal-close", onClick: closeCheckout, "aria-label": "Close checkout", children: /* @__PURE__ */ jsx(X, { size: 16 }) }),
      lastOrder ? /* @__PURE__ */ jsx(OrderConfirmed, { onDone: startNewOrder }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("div", { className: "checkout-progress", children: steps.map((step) => /* @__PURE__ */ jsxs(
          "div",
          {
            className: `checkout-progress__step ${checkoutStep === step.number ? "is-active" : ""} ${checkoutStep > step.number ? "is-done" : ""}`,
            children: [
              /* @__PURE__ */ jsx("span", { children: checkoutStep > step.number ? /* @__PURE__ */ jsx(Check, { size: 12 }) : step.number }),
              /* @__PURE__ */ jsx("b", { children: step.label })
            ]
          },
          step.number
        )) }),
        /* @__PURE__ */ jsxs("div", { className: "checkout-body", children: [
          checkoutStep === 1 && /* @__PURE__ */ jsx(StepOrder, { onContinue: () => goToStep(2) }),
          checkoutStep === 2 && /* @__PURE__ */ jsx(StepDetails, { onBack: () => goToStep(1), onContinue: () => goToStep(3) }),
          checkoutStep === 3 && /* @__PURE__ */ jsx(StepPayment, { onBack: () => goToStep(2) })
        ] })
      ] })
    ] })
  ] });
}
function useCartLines() {
  const { cart, updateQuantity, removeFromCart } = useStore();
  const lines = Object.entries(cart).map(([id, quantity]) => ({
    product: products.find((item) => item.id === Number(id)),
    quantity
  }));
  const subtotal = lines.reduce((sum, line) => sum + line.product.price * line.quantity, 0);
  return { lines, subtotal, updateQuantity, removeFromCart };
}
function StepOrder({ onContinue }) {
  const { lines, subtotal, updateQuantity, removeFromCart } = useCartLines();
  return /* @__PURE__ */ jsxs("div", { className: "checkout-step", children: [
    /* @__PURE__ */ jsx("h2", { children: "Order Summary" }),
    /* @__PURE__ */ jsx("p", { className: "checkout-step__hint", children: "Review your items and adjust quantities before continuing." }),
    /* @__PURE__ */ jsx("div", { className: "order-card", children: lines.length === 0 ? /* @__PURE__ */ jsx("p", { className: "order-empty", children: "Your cart is empty. Close this window and add products first." }) : lines.map(({ product, quantity }) => /* @__PURE__ */ jsxs("div", { className: "order-line", children: [
      /* @__PURE__ */ jsx(ProductVisual, { product, compact: true }),
      /* @__PURE__ */ jsxs("div", { className: "order-line__info", children: [
        /* @__PURE__ */ jsx("h3", { children: product.name }),
        /* @__PURE__ */ jsxs("span", { children: [
          formatPrice(product.price),
          " each"
        ] })
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "quantity", children: [
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => updateQuantity(product.id, quantity - 1),
            "aria-label": "Decrease quantity",
            children: /* @__PURE__ */ jsx(Minus, { size: 12 })
          }
        ),
        /* @__PURE__ */ jsx("span", { children: quantity }),
        /* @__PURE__ */ jsx(
          "button",
          {
            onClick: () => updateQuantity(product.id, quantity + 1),
            "aria-label": "Increase quantity",
            children: /* @__PURE__ */ jsx(Plus, { size: 12 })
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("div", { className: "order-line__price", children: [
        /* @__PURE__ */ jsx("b", { children: formatPrice(product.price * quantity) }),
        /* @__PURE__ */ jsx("button", { onClick: () => removeFromCart(product.id), children: "Remove" })
      ] })
    ] }, product.id)) }),
    /* @__PURE__ */ jsxs("div", { className: "checkout-footer", children: [
      /* @__PURE__ */ jsxs("div", { className: "checkout-total-row", children: [
        /* @__PURE__ */ jsx("span", { children: "Items Subtotal" }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(subtotal) })
      ] }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "button button--dark button--wide",
          disabled: !lines.length,
          onClick: onContinue,
          id: "checkout-continue-to-shipping",
          children: "Continue to Shipping"
        }
      )
    ] })
  ] });
}
const requiredFields = ["fullName", "contactNumber", "address"];
function StepDetails({ onBack, onContinue }) {
  const { buyer, setBuyerField, courier, setCourier, region, setRegion } = useStore();
  const [touched, setTouched] = useState(false);
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0];
  const isLalamove = courier === "lalamove";
  const valid = requiredFields.every((field) => buyer[field].trim().length > 0);
  const handleContinue = () => {
    setTouched(true);
    if (valid) onContinue();
  };
  return /* @__PURE__ */ jsxs("div", { className: "checkout-step", children: [
    /* @__PURE__ */ jsx("h2", { children: "Shipping Details" }),
    /* @__PURE__ */ jsx("p", { className: "checkout-step__hint", children: "Enter your delivery information. Fields marked with * are required." }),
    /* @__PURE__ */ jsxs("div", { className: "checkout-form", children: [
      /* @__PURE__ */ jsxs("label", { className: touched && !buyer.fullName ? "has-error" : "", children: [
        /* @__PURE__ */ jsx("span", { children: "Full Name *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: buyer.fullName,
            onChange: (event) => setBuyerField("fullName", event.target.value),
            placeholder: "e.g. Juana Dela Cruz",
            autoComplete: "name"
          }
        ),
        touched && !buyer.fullName && /* @__PURE__ */ jsx("em", { className: "field-error", children: "Full name is required." })
      ] }),
      /* @__PURE__ */ jsxs("label", { className: touched && !buyer.contactNumber ? "has-error" : "", children: [
        /* @__PURE__ */ jsx("span", { children: "Contact Number *" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: buyer.contactNumber,
            onChange: (event) => setBuyerField("contactNumber", event.target.value),
            placeholder: "09XX XXX XXXX",
            type: "tel",
            autoComplete: "tel"
          }
        ),
        touched && !buyer.contactNumber && /* @__PURE__ */ jsx("em", { className: "field-error", children: "Contact number is required." })
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        /* @__PURE__ */ jsx("span", { children: "Email Address" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            type: "email",
            value: buyer.email,
            onChange: (event) => setBuyerField("email", event.target.value),
            placeholder: "you@email.com (optional)",
            autoComplete: "email"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { children: [
        /* @__PURE__ */ jsx("span", { children: "Discord / Social Handle" }),
        /* @__PURE__ */ jsx(
          "input",
          {
            value: buyer.socialHandle,
            onChange: (event) => setBuyerField("socialHandle", event.target.value),
            placeholder: "@username (optional)"
          }
        )
      ] }),
      /* @__PURE__ */ jsxs("label", { className: `span-2 ${touched && !buyer.address ? "has-error" : ""}`, children: [
        /* @__PURE__ */ jsx("span", { children: "Delivery Address *" }),
        /* @__PURE__ */ jsx(
          "textarea",
          {
            value: buyer.address,
            onChange: (event) => setBuyerField("address", event.target.value),
            placeholder: "House/unit, street, barangay, city, province",
            rows: 3,
            autoComplete: "street-address"
          }
        ),
        touched && !buyer.address && /* @__PURE__ */ jsx("em", { className: "field-error", children: "Delivery address is required." })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Courier" }),
    /* @__PURE__ */ jsx("div", { className: "option-grid", children: couriers.map((item) => /* @__PURE__ */ jsxs(
      "button",
      {
        className: `option-tile ${courier === item.id ? "is-active" : ""}`,
        onClick: () => setCourier(item.id),
        children: [
          /* @__PURE__ */ jsx("b", { children: item.label }),
          /* @__PURE__ */ jsx("span", { children: item.note })
        ]
      },
      item.id
    )) }),
    isLalamove ? /* @__PURE__ */ jsxs("div", { className: "checkout-notice checkout-notice--lalamove", role: "note", children: [
      /* @__PURE__ */ jsx("strong", { children: "Choosing Lalamove?" }),
      " Please get in touch with us at",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:lovin.glow.ph@gmail.com", className: "notice-link", children: "lovin.glow.ph@gmail.com" }),
      " ",
      "to arrange your booking.",
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("br", {}),
      /* @__PURE__ */ jsx("strong", { children: "Note:" }),
      " The delivery fee is handled separately and will",
      " ",
      /* @__PURE__ */ jsx("em", { children: "not" }),
      " be charged at checkout."
    ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
      /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Shipping Region" }),
      /* @__PURE__ */ jsx("div", { className: "option-grid option-grid--three", children: shippingRegions.map((item) => /* @__PURE__ */ jsxs(
        "button",
        {
          className: `option-tile ${region === item.id ? "is-active" : ""}`,
          onClick: () => setRegion(item.id),
          children: [
            /* @__PURE__ */ jsx("b", { children: item.label }),
            /* @__PURE__ */ jsx("span", { children: formatPrice(item.fee) })
          ]
        },
        item.id
      )) }),
      /* @__PURE__ */ jsxs("div", { className: "checkout-notice", children: [
        /* @__PURE__ */ jsx("strong", { children: "Note:" }),
        " Shipping fees are estimates and may vary depending on package weight and the number of parcels. Your selected region (",
        selectedRegion.label,
        ") adds",
        " ",
        formatPrice(selectedRegion.fee),
        " to your total."
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "checkout-footer checkout-footer--split", children: [
      /* @__PURE__ */ jsx("button", { className: "button button--outline", onClick: onBack, id: "checkout-back-to-order", children: "Back" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "button button--dark",
          onClick: handleContinue,
          id: "checkout-continue-to-payment",
          children: "Continue to Payment"
        }
      )
    ] })
  ] });
}
function StepPayment({ onBack }) {
  const {
    paymentMethodId,
    setPaymentMethodId,
    receiptFile,
    setReceiptFile,
    region,
    courier,
    orderReference,
    placingOrder,
    placeOrder
  } = useStore();
  const { lines, subtotal } = useCartLines();
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef(null);
  const isLalamove = courier === "lalamove";
  const selectedRegion = shippingRegions.find((item) => item.id === region) ?? shippingRegions[0];
  const shippingFee = isLalamove ? 0 : selectedRegion.fee;
  const total = subtotal + shippingFee;
  const method = paymentMethods.find((item) => item.id === paymentMethodId);
  const handleFile = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/") && file.type !== "application/pdf") return;
    setReceiptFile(file);
  };
  return /* @__PURE__ */ jsxs("div", { className: "checkout-step", children: [
    /* @__PURE__ */ jsx("h2", { children: "Payment" }),
    /* @__PURE__ */ jsxs("p", { className: "checkout-step__hint", children: [
      "Order Reference: ",
      /* @__PURE__ */ jsx("b", { className: "order-ref", children: orderReference })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "order-card order-card--summary", children: [
      lines.map(({ product, quantity }) => /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          product.name,
          " × ",
          quantity
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(product.price * quantity) })
      ] }, product.id)),
      /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsx("span", { children: "Order Subtotal" }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(subtotal) })
      ] }),
      /* @__PURE__ */ jsx("div", { className: "summary-line", children: isLalamove ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { children: "Shipping Fee" }),
        /* @__PURE__ */ jsx("b", { className: "shipping-arranged", children: "Arranged separately" })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Shipping Fee (",
          selectedRegion.label,
          ")"
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(shippingFee) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "summary-line summary-line--total", children: [
        /* @__PURE__ */ jsx("span", { children: "Total Amount Due" }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(total) })
      ] })
    ] }),
    isLalamove && /* @__PURE__ */ jsxs("div", { className: "checkout-notice checkout-notice--lalamove", role: "note", children: [
      /* @__PURE__ */ jsx("strong", { children: "Lalamove delivery fee not included." }),
      " Please contact us at",
      " ",
      /* @__PURE__ */ jsx("a", { href: "mailto:lovin.glow.ph@gmail.com", className: "notice-link", children: "lovin.glow.ph@gmail.com" }),
      " ",
      "to coordinate your booking after placing your order."
    ] }),
    /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Payment Method" }),
    /* @__PURE__ */ jsx("div", { className: "payment-grid", children: paymentMethods.map((item) => /* @__PURE__ */ jsx(
      "button",
      {
        className: `payment-pill ${paymentMethodId === item.id ? "is-active" : ""}`,
        onClick: () => setPaymentMethodId(item.id),
        children: item.label
      },
      item.id
    )) }),
    method && /* @__PURE__ */ jsxs("div", { className: "payment-details", children: [
      method.qrImage && /* @__PURE__ */ jsx(
        "img",
        {
          src: method.qrImage,
          alt: `${method.label} QR code`,
          className: "payment-qr",
          onError: (event) => {
            event.target.style.display = "none";
          }
        }
      ),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("b", { children: method.accountName }),
        /* @__PURE__ */ jsx("span", { children: method.accountNumber }),
        method.note && /* @__PURE__ */ jsx("p", { children: method.note })
      ] })
    ] }),
    /* @__PURE__ */ jsx("div", { className: "checkout-subhead", children: "Upload Payment Receipt" }),
    /* @__PURE__ */ jsx("p", { className: "checkout-step__hint", children: "Attach your GCash, Maya, or bank transfer receipt (image or PDF)." }),
    /* @__PURE__ */ jsxs(
      "div",
      {
        className: `upload-zone ${dragOver ? "is-drag" : ""} ${receiptFile ? "has-file" : ""}`,
        onDragOver: (event) => {
          event.preventDefault();
          setDragOver(true);
        },
        onDragLeave: () => setDragOver(false),
        onDrop: (event) => {
          event.preventDefault();
          setDragOver(false);
          handleFile(event.dataTransfer.files?.[0]);
        },
        onClick: () => inputRef.current?.click(),
        role: "button",
        tabIndex: 0,
        "aria-label": "Upload payment receipt",
        onKeyDown: (e) => e.key === "Enter" && inputRef.current?.click(),
        children: [
          /* @__PURE__ */ jsx(
            "input",
            {
              ref: inputRef,
              type: "file",
              accept: "image/*,application/pdf",
              hidden: true,
              onChange: (event) => handleFile(event.target.files?.[0])
            }
          ),
          receiptFile ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(ImagePlus, { size: 24 }),
            /* @__PURE__ */ jsx("b", { children: receiptFile.name }),
            /* @__PURE__ */ jsx("span", { children: "Click to replace" })
          ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(UploadCloud, { size: 24 }),
            /* @__PURE__ */ jsx("b", { children: "Drag & drop your receipt here" }),
            /* @__PURE__ */ jsx("span", { children: "or click to browse — JPG, PNG, or PDF" })
          ] })
        ]
      }
    ),
    /* @__PURE__ */ jsxs("div", { className: "checkout-footer checkout-footer--split", children: [
      /* @__PURE__ */ jsx("button", { className: "button button--outline", onClick: onBack, id: "checkout-back-to-shipping", children: "Back" }),
      /* @__PURE__ */ jsx(
        "button",
        {
          className: "button button--dark",
          disabled: !method || !receiptFile || placingOrder,
          onClick: placeOrder,
          id: "place-order-button",
          children: placingOrder ? /* @__PURE__ */ jsxs(Fragment, { children: [
            /* @__PURE__ */ jsx(Loader2, { className: "spin", size: 14 }),
            " Placing Order…"
          ] }) : "Place Order"
        }
      )
    ] })
  ] });
}
function OrderConfirmed({ onDone }) {
  const { lastOrder } = useStore();
  if (!lastOrder) return null;
  const region = shippingRegions.find((item) => item.id === lastOrder.region);
  const method = paymentMethods.find((item) => item.id === lastOrder.paymentMethod);
  const isLalamove = lastOrder.courier === "lalamove";
  const placedDate = new Date(lastOrder.placedAt).toLocaleString("en-PH", {
    dateStyle: "medium",
    timeStyle: "short"
  });
  return /* @__PURE__ */ jsxs("div", { className: "order-confirmed", children: [
    /* @__PURE__ */ jsx("span", { className: "order-confirmed__icon", children: /* @__PURE__ */ jsx(Check, { size: 24 }) }),
    /* @__PURE__ */ jsx("span", { className: "confirmed-label", children: "Order Placed Successfully" }),
    /* @__PURE__ */ jsxs("h2", { children: [
      "Thank you, ",
      lastOrder.buyer.fullName.split(" ")[0] || "for your order",
      "!"
    ] }),
    /* @__PURE__ */ jsxs("p", { children: [
      "Your order reference is ",
      /* @__PURE__ */ jsx("b", { children: lastOrder.reference }),
      ". We are verifying your payment and will reach out to you shortly."
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "order-card order-card--summary", children: [
      lastOrder.lines.map((line) => /* @__PURE__ */ jsxs("div", { className: "summary-line", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          line.name,
          " × ",
          line.quantity
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(line.price * line.quantity) })
      ] }, line.productId)),
      /* @__PURE__ */ jsx("div", { className: "summary-line", children: isLalamove ? /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsx("span", { children: "Shipping Fee" }),
        /* @__PURE__ */ jsx("b", { className: "shipping-arranged", children: "Arranged separately" })
      ] }) : /* @__PURE__ */ jsxs(Fragment, { children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Shipping Fee (",
          region?.label,
          ")"
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(lastOrder.shippingFee) })
      ] }) }),
      /* @__PURE__ */ jsxs("div", { className: "summary-line summary-line--total", children: [
        /* @__PURE__ */ jsxs("span", { children: [
          "Total Paid via ",
          method?.label
        ] }),
        /* @__PURE__ */ jsx("b", { children: formatPrice(lastOrder.total) })
      ] })
    ] }),
    /* @__PURE__ */ jsxs("div", { className: "order-confirmed__meta", children: [
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "Date & Time" }),
        /* @__PURE__ */ jsx("b", { children: placedDate })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "Delivery Address" }),
        /* @__PURE__ */ jsx("b", { children: lastOrder.buyer.address })
      ] }),
      /* @__PURE__ */ jsxs("div", { children: [
        /* @__PURE__ */ jsx("span", { children: "Receipt on File" }),
        /* @__PURE__ */ jsx("b", { children: lastOrder.receiptName })
      ] })
    ] }),
    /* @__PURE__ */ jsx("button", { className: "button button--dark button--wide", onClick: onDone, id: "continue-shopping-btn", children: "Continue Shopping" })
  ] });
}
const Route$1 = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LovieNGlow — Peptide Beauty & Research Supplies" },
      {
        name: "description",
        content: "Shop premium GLP peptides, skinboosters, topicals, liquid blends, research waters, and essential supplies. Fast, discreet delivery."
      },
      { property: "og:title", content: "LovieNGlow — Peptide Beauty & Research Supplies" },
      {
        property: "og:description",
        content: "A premium one-stop shop for peptide beauty products and research essentials. Browse the full catalog and order online."
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "LovieNGlow — Peptide Beauty & Research Supplies" },
      {
        name: "twitter:description",
        content: "Premium peptides, skinboosters, topicals, and research supplies. Order online with secure payment."
      }
    ],
    links: [
      { rel: "icon", href: "/favicon.ico" },
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com"
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous"
      }
    ]
  }),
  shellComponent: RootDocument
});
function RootDocument({ children }) {
  return /* @__PURE__ */ jsxs("html", { lang: "en", children: [
    /* @__PURE__ */ jsx("head", { children: /* @__PURE__ */ jsx(HeadContent, {}) }),
    /* @__PURE__ */ jsxs("body", { children: [
      /* @__PURE__ */ jsxs(StoreProvider, { children: [
        /* @__PURE__ */ jsx(Header, {}),
        /* @__PURE__ */ jsx("main", { children }),
        /* @__PURE__ */ jsx(Footer, {}),
        /* @__PURE__ */ jsx(CartDrawer, {}),
        /* @__PURE__ */ jsx(CheckoutModal, {}),
        /* @__PURE__ */ jsx(Toast, {})
      ] }),
      /* @__PURE__ */ jsx(Scripts, {})
    ] })
  ] });
}
const $$splitComponentImporter = () => import("./index-C_s6aa0_.js");
const Route = createFileRoute("/")({
  component: lazyRouteComponent($$splitComponentImporter, "component")
});
const IndexRoute = Route.update({
  id: "/",
  path: "/",
  getParentRoute: () => Route$1
});
const rootRouteChildren = {
  IndexRoute
};
const routeTree = Route$1._addFileChildren(rootRouteChildren)._addFileTypes();
const getRouter = () => {
  const router2 = createRouter({
    routeTree,
    scrollRestoration: true,
    defaultPreloadStaleTime: 0
  });
  return router2;
};
const router = /* @__PURE__ */ Object.freeze(/* @__PURE__ */ Object.defineProperty({
  __proto__: null,
  getRouter
}, Symbol.toStringTag, { value: "Module" }));
export {
  ProductVisual as P,
  categories as c,
  formatPrice as f,
  products as p,
  router as r,
  useStore as u
};
