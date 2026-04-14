/**
 * Bilingual WhatsApp message parser — Telugu, Tamil, English
 * Extracts: medicine names, quantities, customer name, area/address, intent
 */

// Common medicine names (brand names used in Indian pharmacies)
const MEDICINE_DB = [
    // Pain / Fever
    'paracetamol', 'dolo', 'crocin', 'calpol', 'combiflam', 'ibuprofen', 'disprin', 'saridon', 'metacin',
    // Diabetes
    'metformin', 'glycomet', 'glucophage', 'glimepiride', 'amaryl', 'januvia', 'galvus',
    // Blood Pressure
    'amlodipine', 'telmisartan', 'losartan', 'atenolol', 'ramipril', 'enalapril',
    // Antibiotics
    'amoxicillin', 'azithromycin', 'ciprofloxacin', 'cefixime', 'augmentin', 'monocef', 'doxycycline',
    // Gastro
    'omeprazole', 'pantoprazole', 'ranitidine', 'domperidone', 'ondansetron', 'pan-d', 'rantac',
    // Cold / Allergy
    'cetirizine', 'montelukast', 'levocetirizine', 'allegra', 'sinarest', 'vicks',
    // Vitamins
    'vitamin', 'b-complex', 'calcium', 'iron', 'folic acid', 'shelcal', 'becosules', 'zincovit',
    // Skin
    'betadine', 'soframycin', 'clobetasol', 'candid', 'clotrimazole',
    // Common OTC
    'ors', 'digene', 'gelusil', 'pudin hara', 'hajmola', 'burnol', 'volini', 'moov', 'zandu balm',
    'insulin', 'thyronorm', 'eltroxin', 'ecosprin',
];

// Telugu keywords
const TELUGU = {
    need: ['కావాలి', 'పంపించండి', 'ఇవ్వండి', 'తీసుకురా', 'పంపు', 'కావలి'],
    tablets: ['టాబ్లెట్స్', 'టాబ్లెట్', 'మాత్రలు', 'మాత్ర', 'గోలీలు', 'గోలీ'],
    syrup: ['సిరప్', 'మందు', 'నీళ్ళమందు'],
    quantity: ['ఒకటి', 'రెండు', 'మూడు', 'నాలుగు', 'ఐదు', 'ఆరు', 'ఏడు', 'ఎనిమిది', 'తొమ్మిది', 'పది'],
    address_markers: ['నగర్', 'వీధి', 'రోడ్', 'దగ్గర', 'ఏరియా', 'కాలనీ', 'సెంటర్', 'బజార్'],
    greeting: ['నమస్కారం', 'హలో', 'బాబు', 'అన్న', 'సార్'],
};

// Tamil keywords
const TAMIL = {
    need: ['வேண்டும்', 'அனுப்புங்கள்', 'கொடுங்கள்', 'தாங்கள்', 'அனுப்பு', 'வேணும்'],
    tablets: ['மாத்திரை', 'மாத்திரைகள்', 'டேப்லெட்'],
    syrup: ['சிரப்', 'மருந்து'],
    quantity: ['ஒன்று', 'இரண்டு', 'மூன்று', 'நான்கு', 'ஐந்து', 'ஆறு', 'ஏழு', 'எட்டு', 'ஒன்பது', 'பத்து'],
    address_markers: ['நகர்', 'தெரு', 'சாலை', 'அருகில்', 'ஏரியா', 'காலனி', 'சென்டர்', 'பஜார்'],
    greeting: ['வணக்கம்', 'ஹலோ', 'அண்ணா', 'சார்'],
};

// English address markers
const EN_ADDRESS_MARKERS = [
    'nagar', 'street', 'road', 'rd', 'near', 'area', 'colony', 'center', 'centre',
    'bazar', 'bazaar', 'market', 'lane', 'gali', 'chowk', 'circle', 'junction',
    'cross', 'main', 'layout', 'extension', 'phase', 'sector', 'block',
    'pet', 'peta', 'pally', 'pur', 'puram', 'bad', 'abad', 'guda', 'ganj',
];

/**
 * Detect the primary language of a message
 */
function detectLanguage(text) {
    const teluguChars = (text.match(/[\u0C00-\u0C7F]/g) || []).length;
    const tamilChars = (text.match(/[\u0B80-\u0BFF]/g) || []).length;
    const total = text.length;

    if (teluguChars > total * 0.2) return 'telugu';
    if (tamilChars > total * 0.2) return 'tamil';
    return 'english';
}

/**
 * Extract medicine names from message text
 */
function extractMedicines(text) {
    const lower = text.toLowerCase();
    const found = [];

    for (const med of MEDICINE_DB) {
        // Match medicine name with word boundaries
        const regex = new RegExp(`\\b${med.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
        if (regex.test(lower)) {
            // Try to find quantity nearby (e.g., "Dolo 650 10 tablets", "paracetamol 2 strips")
            const qtyRegex = new RegExp(`${med.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}[\\s-]*(\\d+)?[\\s]*(mg|ml|tablets?|strips?|caps?|capsules?|bottles?)?[\\s]*(\\d+)?`, 'i');
            const match = lower.match(qtyRegex);
            found.push({
                name: med,
                strength: match?.[1] || null,
                form: match?.[2] || null,
                quantity: match?.[3] || null,
            });
        }
    }
    return found;
}

/**
 * Extract area/address from message
 */
function extractArea(text) {
    const words = text.split(/[\s,]+/);
    const allMarkers = [...EN_ADDRESS_MARKERS, ...TELUGU.address_markers, ...TAMIL.address_markers];

    for (let i = 0; i < words.length; i++) {
        const word = words[i].toLowerCase();
        for (const marker of allMarkers) {
            if (word.includes(marker.toLowerCase())) {
                // Grab surrounding context (2 words before and after)
                const start = Math.max(0, i - 2);
                const end = Math.min(words.length, i + 3);
                return words.slice(start, end).join(' ');
            }
        }
    }

    // Try "near X" pattern
    const nearMatch = text.match(/(?:near|దగ్గర|அருகில்)\s+(.{3,30})/i);
    if (nearMatch) return nearMatch[1].trim();

    return null;
}

/**
 * Extract intent — is this an order request?
 */
function detectOrderIntent(text) {
    const lower = text.toLowerCase();
    const allNeedWords = [
        'need', 'want', 'send', 'give', 'order', 'deliver', 'required', 'please',
        ...TELUGU.need, ...TAMIL.need,
    ];
    return allNeedWords.some(w => lower.includes(w.toLowerCase()));
}

/**
 * Main parser — extracts structured data from WhatsApp message
 */
function parseWhatsAppMessage(message, senderName = null, callerNumber = null) {
    const language = detectLanguage(message);
    const medicines = extractMedicines(message);
    const area = extractArea(message);
    const isOrder = detectOrderIntent(message) || medicines.length > 0;

    return {
        language,
        is_order: isOrder,
        customer_name: senderName || null,
        customer_phone: callerNumber || null,
        area,
        medicines,
        medicine_count: medicines.length,
        raw_message: message,
        confidence: medicines.length > 0 ? 'high' : (isOrder ? 'medium' : 'low'),
    };
}

module.exports = {
    parseWhatsAppMessage,
    detectLanguage,
    extractMedicines,
    extractArea,
};
