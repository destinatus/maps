#!/usr/bin/env node

/**
 * This script generates placeholder badges for testing purposes.
 * It creates SVG badge files that can be used in the README files.
 */

const fs = require('fs');
const path = require('path');

// Create directories if they don't exist
const clientBadgesDir = path.join(__dirname, '../client/coverage/badges');
const serverBadgesDir = path.join(__dirname, '../server/coverage');

if (!fs.existsSync(clientBadgesDir)) {
  fs.mkdirSync(clientBadgesDir, { recursive: true });
}

if (!fs.existsSync(serverBadgesDir)) {
  fs.mkdirSync(serverBadgesDir, { recursive: true });
}

// Generate SVG badge content
const generateBadge = (label, value, color) => {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="106" height="20" role="img" aria-label="${label}: ${value}">
  <title>${label}: ${value}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="106" height="20" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="61" height="20" fill="#555"/>
    <rect x="61" width="45" height="20" fill="${color}"/>
    <rect width="106" height="20" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="Verdana,Geneva,DejaVu Sans,sans-serif" text-rendering="geometricPrecision" font-size="110">
    <text aria-hidden="true" x="315" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="510">${label}</text>
    <text x="315" y="140" transform="scale(.1)" fill="#fff" textLength="510">${label}</text>
    <text aria-hidden="true" x="825" y="150" fill="#010101" fill-opacity=".3" transform="scale(.1)" textLength="350">${value}</text>
    <text x="825" y="140" transform="scale(.1)" fill="#fff" textLength="350">${value}</text>
  </g>
</svg>`;
};

// Client badges
const clientBadges = [
  { name: 'statements', value: '87%', color: '#4c1' },
  { name: 'branches', value: '75%', color: '#dfb317' },
  { name: 'functions', value: '90%', color: '#4c1' },
  { name: 'lines', value: '85%', color: '#4c1' }
];

// Server badges
const serverBadges = [
  { name: 'statements', value: '82%', color: '#4c1' },
  { name: 'branches', value: '70%', color: '#dfb317' },
  { name: 'functions', value: '85%', color: '#4c1' },
  { name: 'lines', value: '80%', color: '#4c1' }
];

// Generate client badges
clientBadges.forEach(badge => {
  const filePath = path.join(clientBadgesDir, `${badge.name}.svg`);
  fs.writeFileSync(filePath, generateBadge(badge.name, badge.value, badge.color));
  console.log(`Generated client badge: ${filePath}`);
});

// Generate server badges
serverBadges.forEach(badge => {
  const filePath = path.join(serverBadgesDir, `${badge.name}.svg`);
  fs.writeFileSync(filePath, generateBadge(badge.name, badge.value, badge.color));
  console.log(`Generated server badge: ${filePath}`);
});

console.log('All placeholder badges generated successfully!');
