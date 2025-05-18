#!/usr/bin/env node

const url = "https://www.dropbox.com/scl/fi/u84y1qqu7ny43x3rug8w0/NEW-A1-Merkels-Moepse-L01.mp3?rlkey=spk382yq3vl0od5ej2byb8f19&st=2uvzzpg0&dl=0";

// Step 1: Replace domain
console.log("Step 1 - Replace domain:");
let step1 = url.replace('www.dropbox.com', 'dl.dropboxusercontent.com');
console.log(step1);

// Step 2: Replace dl=0 parameter
console.log("\nStep 2 - Replace dl parameter:");
let step2 = step1.replace(/\?dl=0(&.+)?$/, '?raw=1');
console.log(step2);

// Step 3: Remove st parameter
console.log("\nStep 3 - Remove st parameter:");
let step3 = step2.replace(/\?st=[^&]+/, '').replace(/&st=[^&]+/, '');
console.log(step3);

// Step 4: Ensure raw=1 is included
console.log("\nStep 4 - Ensure raw=1 is included:");
let step4 = step3;
if (!step4.includes('raw=1')) {
  if (step4.includes('?')) {
    step4 += '&raw=1';
  } else {
    step4 += '?raw=1';
  }
}
console.log(step4);

console.log("\nFinal URL:");
console.log(step4);
