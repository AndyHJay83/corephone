let wordList = [];
let totalWords = 0;
let isNewMode = true;
let isLexiconMode = true;
let isVowelMode = true;
let isShapeMode = true;
let currentFilteredWords = [];
let currentPosition = -1;
let currentPosition2 = -1;
let currentVowelIndex = 0;
let uniqueVowels = [];
let currentFilteredWordsForVowels = [];
let originalFilteredWords = [];
let hasAdjacentConsonants = null;
let hasO = null;
let selectedCurvedLetter = null;

// Function to check if a word has any adjacent consonants
function hasWordAdjacentConsonants(word) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const wordLower = word.toLowerCase();
    
    for (let i = 0; i < wordLower.length - 1; i++) {
        const currentChar = wordLower[i];
        const nextChar = wordLower[i + 1];
        
        // Check if both current and next characters are consonants
        if (!vowels.has(currentChar) && !vowels.has(nextChar)) {
            console.log(`Found adjacent consonants in "${wordLower}": "${currentChar}${nextChar}" at position ${i}`);
            return true;
        }
    }
    return false;
}

// Letter shape categories with exact categorization
const letterShapes = {
    straight: new Set(['A', 'E', 'F', 'H', 'I', 'K', 'L', 'M', 'N', 'T', 'V', 'W', 'X', 'Y', 'Z']),
    curved: new Set(['B', 'C', 'D', 'G', 'J', 'O', 'P', 'Q', 'R', 'S', 'U'])
};

// Function to get letter shape
function getLetterShape(letter) {
    letter = letter.toUpperCase();
    if (letterShapes.straight.has(letter)) return 'straight';
    if (letterShapes.curved.has(letter)) return 'curved';
    return null;
}

// Function to analyze position shapes
function analyzePositionShapes(words, position) {
    const shapes = {
        straight: new Set(),
        curved: new Set()
    };
    
    let totalLetters = 0;
    
    words.forEach(word => {
        if (word.length > position) {
            const letter = word[position];
            const shape = getLetterShape(letter);
            console.log(`Word ${word}: Position ${position + 1} has letter ${letter} which is ${shape}`);
            if (shape) {
                shapes[shape].add(letter);
                totalLetters++;
            }
        }
    });
    
    const distribution = {
        straight: shapes.straight.size / totalLetters,
        curved: shapes.curved.size / totalLetters
    };
    
    console.log(`Position ${position + 1} analysis:`, {
        shapes: {
            straight: Array.from(shapes.straight),
            curved: Array.from(shapes.curved)
        },
        distribution,
        totalLetters
    });
    
    return {
        shapes,
        distribution,
        totalLetters
    };
}

// Function to find position with least variance
function findLeastVariancePosition(words, startPos, endPos) {
    let maxVariance = -1;
    let result = -1;
    
    console.log('Finding position with most variance in words:', words);
    
    for (let pos = startPos; pos < endPos; pos++) {
        const analysis = analyzePositionShapes(words, pos);
        
        // Skip if we don't have at least one letter of each shape
        if (analysis.shapes.straight.size === 0 || analysis.shapes.curved.size === 0) {
            console.log(`Position ${pos + 1} skipped: missing one or both shapes`);
            continue;
        }
        
        // Calculate variance between the two distributions
        const variance = Math.abs(analysis.distribution.straight - analysis.distribution.curved);
        console.log(`Position ${pos + 1} variance:`, variance, 'straight:', analysis.distribution.straight, 'curved:', analysis.distribution.curved);
        
        if (variance > maxVariance) {
            maxVariance = variance;
            result = pos;
            console.log(`New best position: ${pos + 1} with variance ${variance}`);
        }
    }
    
    console.log('Selected position:', result + 1, 'with variance:', maxVariance);
    return result;
}

// Function to get shortest word length
function getShortestWordLength(words) {
    return Math.min(...words.map(word => word.length));
}

// Function to filter words by shape category
function filterWordsByShape(words, position, category) {
    return words.filter(word => {
        if (word.length <= position) return false;
        const letter = word[position];
        return getLetterShape(letter) === category;
    });
}

// Function to update shape display
function updateShapeDisplay(words) {
    console.log('Updating shape display with words:', words.length);
    const shapeFeature = document.getElementById('shapeFeature');
    const shapeDisplay = shapeFeature.querySelector('.shape-display');
    
    if (!isShapeMode || words.length === 0) {
        console.log('Shape mode disabled or no words to display');
        shapeFeature.style.display = 'none';
        return;
    }

    // Get the length of the shortest word to avoid out-of-bounds
    const shortestLength = getShortestWordLength(words);
    console.log('Shortest word length:', shortestLength);
    
    // Analyze all positions in the words
    const startPos = 0;
    const endPos = shortestLength;
    console.log('Analyzing positions from', startPos, 'to', endPos);

    const position = findLeastVariancePosition(words, startPos, endPos);
    console.log('Found position with most variance:', position);
    
    if (position === -1) {
        console.log('No valid position found');
        shapeFeature.style.display = 'none';
        return;
    }

    currentPosition = position;
    const analysis = analyzePositionShapes(words, position);
    console.log('Shape analysis:', analysis);
    
    const shapes = analysis.shapes;
    
    const positionDisplay = shapeDisplay.querySelector('.position-display');
    positionDisplay.textContent = `Position ${position + 1}`;
    
    const categoryButtons = shapeDisplay.querySelector('.category-buttons');
    categoryButtons.innerHTML = '';
    
    Object.entries(shapes).forEach(([category, letters]) => {
        if (letters.size > 0) {
            const button = document.createElement('button');
            button.className = 'category-button';
            const percentage = Math.round(analysis.distribution[category] * 100);
            button.textContent = `${category.toUpperCase()} (${percentage}%)`;
            button.addEventListener('click', () => {
                const filteredWords = filterWordsByShape(words, position, category);
                displayResults(filteredWords);
                expandWordList();
            });
            categoryButtons.appendChild(button);
            console.log('Added button for category:', category, 'with percentage:', percentage);
        }
    });
    
    shapeFeature.style.display = 'block';
    console.log('Shape feature display updated');
}

// Function to load word list
async function loadWordList() {
    try {
        console.log('Attempting to load word list...');
        const possiblePaths = [
            'words/ENUK-Long words Noun.txt',
            './words/ENUK-Long words Noun.txt',
            '../words/ENUK-Long words Noun.txt',
            'ENUK-Long words Noun.txt'
        ];

        let response = null;
        let successfulPath = null;

        for (const path of possiblePaths) {
            try {
                console.log(`Trying path: ${path}`);
                response = await fetch(path);
                if (response.ok) {
                    successfulPath = path;
                    break;
                }
            } catch (e) {
                console.log(`Failed to load from ${path}: ${e.message}`);
            }
        }

        if (!response || !response.ok) {
            throw new Error(`Could not load word list from any of the attempted paths`);
        }

        console.log(`Successfully loaded from: ${successfulPath}`);
        const text = await response.text();
        console.log('Raw text length:', text.length);
        
        wordList = text.split('\n')
            .map(word => word.trim())
            .filter(word => word !== '');
            
        console.log('Processed word list length:', wordList.length);
        
        if (wordList.length === 0) {
            throw new Error('No words found in the file');
        }
        
        totalWords = wordList.length;
        console.log(`Successfully loaded ${totalWords} words`);
        updateWordCount(totalWords);
        displayResults(wordList);
        
    } catch (error) {
        console.error('Error loading word list:', error);
        document.getElementById('wordCount').textContent = 'Error loading words';
        
        const errorDetails = document.createElement('div');
        errorDetails.style.color = 'red';
        errorDetails.style.padding = '10px';
        errorDetails.textContent = `Error details: ${error.message}`;
        document.getElementById('wordCount').parentNode.appendChild(errorDetails);
    }
}

// Function to update word count
function updateWordCount(count) {
    const wordCountElement = document.getElementById('wordCount');
    if (wordCountElement) {
        wordCountElement.textContent = count;
    }
}

// Function to get consonants in order
function getConsonantsInOrder(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const consonants = [];
    const word = str.toLowerCase();
    
    for (let i = 0; i < word.length; i++) {
        if (!vowels.has(word[i])) {
            consonants.push(word[i]);
        }
    }
    
    console.log('Input word:', word);
    console.log('Consonants found in order:', consonants);
    return consonants;
}

// Function to get unique vowels
function getUniqueVowels(str) {
    const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
    const uniqueVowels = new Set();
    str.toLowerCase().split('').forEach(char => {
        if (vowels.has(char)) {
            uniqueVowels.add(char);
        }
    });
    const result = Array.from(uniqueVowels);
    console.log('Found unique vowels:', result);
    return result;
}

// Function to find least common vowel
function findLeastCommonVowel(words, vowels) {
    const vowelCounts = {};
    vowels.forEach(vowel => {
        vowelCounts[vowel] = 0;
    });

    words.forEach(word => {
        const wordLower = word.toLowerCase();
        vowels.forEach(vowel => {
            if (wordLower.includes(vowel)) {
                vowelCounts[vowel]++;
            }
        });
    });

    console.log('Vowel counts:', vowelCounts);

    let leastCommonVowel = vowels[0];
    let lowestCount = vowelCounts[vowels[0]];

    vowels.forEach(vowel => {
        if (vowelCounts[vowel] < lowestCount) {
            lowestCount = vowelCounts[vowel];
            leastCommonVowel = vowel;
        }
    });

    console.log('Selected least common vowel:', leastCommonVowel, 'with count:', lowestCount);
    return leastCommonVowel;
}

// Function to handle vowel selection
function handleVowelSelection(includeVowel) {
    const currentVowel = uniqueVowels[currentVowelIndex];
    console.log('Handling vowel selection:', currentVowel, 'Include:', includeVowel);
    console.log('Current vowel index:', currentVowelIndex);
    console.log('Remaining vowels:', uniqueVowels);
    console.log('Before filtering:', currentFilteredWordsForVowels.length, 'words');
    
    if (includeVowel) {
        currentFilteredWordsForVowels = currentFilteredWordsForVowels.filter(word => 
            word.toLowerCase().includes(currentVowel)
        );
    } else {
        currentFilteredWordsForVowels = currentFilteredWordsForVowels.filter(word => 
            !word.toLowerCase().includes(currentVowel)
        );
    }
    
    console.log('After filtering:', currentFilteredWordsForVowels.length, 'words');
    
    // Remove only the current vowel from uniqueVowels array
    uniqueVowels = uniqueVowels.filter((v, index) => index !== currentVowelIndex);
    
    // Update the display with the filtered words
    displayResults(currentFilteredWordsForVowels);
    
    // If we still have vowels to process, show the next one
    if (uniqueVowels.length > 0) {
        const vowelFeature = document.getElementById('vowelFeature');
        const vowelLetter = vowelFeature.querySelector('.vowel-letter');
        console.log('Setting next vowel letter to:', uniqueVowels[0].toUpperCase());
        vowelLetter.textContent = uniqueVowels[0].toUpperCase();
    } else {
        // No more vowels to process, mark as completed and move to next feature
        document.getElementById('vowelFeature').classList.add('completed');
        // Update currentFilteredWords with the vowel-filtered results
        currentFilteredWords = [...currentFilteredWordsForVowels];
        console.log('Vowel feature completed, moving to next feature');
        showNextFeature();
    }
}

// Function to show next feature
function showNextFeature() {
    console.log('Showing next feature...');
    console.log('Current states:', {
        hasAdjacentConsonants,
        isVowelMode,
        isLexiconMode,
        isShapeMode,
        position1Completed: document.getElementById('position1Feature').classList.contains('completed'),
        vowelCompleted: document.getElementById('vowelFeature').classList.contains('completed'),
        lexiconCompleted: document.getElementById('lexiconFeature').classList.contains('completed'),
        shapeCompleted: document.getElementById('shapeFeature').classList.contains('completed'),
        oCompleted: document.getElementById('oFeature').classList.contains('completed'),
        curvedCompleted: document.getElementById('curvedFeature').classList.contains('completed')
    });
    
    // First hide all features
    const allFeatures = [
        'consonantQuestion',
        'position1Feature',
        'vowelFeature',
        'lexiconFeature',
        'shapeFeature',
        'oFeature',
        'curvedFeature'
    ];
    
    allFeatures.forEach(featureId => {
        document.getElementById(featureId).style.display = 'none';
    });
    
    // Then show the appropriate feature based on the current state
    if (hasAdjacentConsonants === null) {
        console.log('Showing consonant question');
        const consonantQuestion = document.getElementById('consonantQuestion');
        console.log('consonantQuestion element:', consonantQuestion);
        if (consonantQuestion) {
            consonantQuestion.style.display = 'block';
            console.log('Consonant question display set to block');
        } else {
            console.error('Consonant question element not found!');
        }
    }
    else if (!document.getElementById('position1Feature').classList.contains('completed')) {
        console.log('Showing Position 1 feature');
        document.getElementById('position1Feature').style.display = 'block';
    }
    else if (isVowelMode && !document.getElementById('vowelFeature').classList.contains('completed')) {
        console.log('Showing VOWEL feature');
        const vowelFeature = document.getElementById('vowelFeature');
        vowelFeature.style.display = 'block';
        
        // Initialize vowel processing
        if (uniqueVowels.length === 0) {
            console.log('Initializing vowels from current word list');
            // Get unique vowels from current word list
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            uniqueVowels = Array.from(new Set(
                currentFilteredWords.join('').toLowerCase().split('')
                    .filter(char => vowels.has(char))
            ));
            currentFilteredWordsForVowels = [...currentFilteredWords];
            originalFilteredWords = [...currentFilteredWords];
            currentVowelIndex = 0;
        }
        
        // Set up the vowel display
        const vowelLetter = vowelFeature.querySelector('.vowel-letter');
        if (uniqueVowels.length > 0) {
            console.log('Setting vowel letter to:', uniqueVowels[0].toUpperCase());
            vowelLetter.textContent = uniqueVowels[0].toUpperCase();
            vowelLetter.style.display = 'inline-block';
        } else {
            console.log('No vowels found in current word list');
            vowelLetter.style.display = 'none';
        }
    }
    else if (isLexiconMode && !document.getElementById('lexiconFeature').classList.contains('completed')) {
        console.log('Showing COLOUR3 feature');
        const lexiconFeature = document.getElementById('lexiconFeature');
        lexiconFeature.style.display = 'block';
    }
    else if (isShapeMode && !document.getElementById('shapeFeature').classList.contains('completed')) {
        console.log('Showing SHAPE feature');
        document.getElementById('shapeFeature').style.display = 'block';
        updateShapeDisplay(currentFilteredWords);
    }
    else if (!document.getElementById('oFeature').classList.contains('completed')) {
        console.log('Showing O? feature');
        document.getElementById('oFeature').style.display = 'block';
    }
    else if (!document.getElementById('curvedFeature').classList.contains('completed')) {
        console.log('Showing CURVED feature');
        document.getElementById('curvedFeature').style.display = 'block';
    }
    else {
        console.log('Expanding word list');
        expandWordList();
    }
}

// Function to expand word list
function expandWordList() {
    const wordListContainer = document.getElementById('wordListContainer');
    wordListContainer.classList.add('expanded');
}

// Function to display results
function displayResults(words) {
    currentFilteredWords = words;
    const resultsContainer = document.getElementById('resultsContainer');
    resultsContainer.innerHTML = '';
    
    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item';
        wordElement.textContent = word.toUpperCase();
        resultsContainer.appendChild(wordElement);
    });
    
    updateWordCount(words.length);
}

// Function to reset the app
function resetApp() {
    // Reset all variables
    currentFilteredWords = [...originalFilteredWords];
    currentVowelIndex = 0;
    uniqueVowels = [];
    hasAdjacentConsonants = null;
    selectedCurvedLetter = null;
    hasO = null;
    currentFilteredWordsForVowels = [];
    
    // Clear all results and show full wordlist
    displayResults(originalFilteredWords);
    
    // Reset all features
    const features = [
        'consonantQuestion',
        'position1Feature',
        'vowelFeature',
        'lexiconFeature',
        'shapeFeature',
        'oFeature',
        'curvedFeature'
    ];
    
    features.forEach(featureId => {
        const feature = document.getElementById(featureId);
        if (feature) {
            // Remove completed class from all features
            feature.classList.remove('completed');
            // Hide all features initially
            feature.style.display = 'none';
        }
    });
    
    // Reset all toggles to their default state
    document.getElementById('modeToggle').checked = true;
    document.getElementById('lexiconToggle').checked = true;
    document.getElementById('vowelToggle').checked = true;
    document.getElementById('shapeToggle').checked = true;
    
    // Reset all input fields
    document.getElementById('position1Input').value = '';
    
    // Show the first feature (consonant question)
    document.getElementById('consonantQuestion').style.display = 'block';
    
    // Update word count
    updateWordCount(originalFilteredWords.length);
}

// Function to toggle mode
function toggleMode() {
    isNewMode = document.getElementById('modeToggle').checked;
    resetApp();
}

// Function to toggle feature mode
function toggleFeature(featureId) {
    const toggle = document.getElementById(featureId.replace('Feature', 'Toggle'));
    const isEnabled = toggle.checked;
    
    switch(featureId) {
        case 'lexiconFeature':
            isLexiconMode = isEnabled;
            break;
        case 'vowelFeature':
            isVowelMode = isEnabled;
            break;
        case 'shapeFeature':
            isShapeMode = isEnabled;
            break;
    }
    
    // If the feature is disabled, mark it as completed
    if (!isEnabled) {
        document.getElementById(featureId).classList.add('completed');
    }
    
    // Update the display
    showNextFeature();
}

// Function to export wordlist
function exportWordlist() {
    // Create a text file with the current filtered words
    const text = currentFilteredWords.join('\n');
    const blob = new Blob([text], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    
    // Create a temporary link element
    const link = document.createElement('a');
    link.href = url;
    link.download = `wordlist_${currentFilteredWords.length}_words.txt`;
    
    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    // Clean up the URL object
    window.URL.revokeObjectURL(url);
}

// Function to filter words by COLOUR3
function filterWordsByColour3(words) {
    const colour3Letters = new Set(['A', 'B', 'C', 'E', 'G', 'I', 'L', 'N', 'M', 'O', 'P', 'R', 'S', 'T', 'V', 'W', 'Y']);
    
    return words.filter(word => {
        // Check first 3 characters
        for (let i = 0; i < Math.min(3, word.length); i++) {
            if (colour3Letters.has(word[i].toUpperCase())) {
                return true; // Keep word if any of first 3 letters are in the set
            }
        }
        return false; // Remove word if none of first 3 letters are in the set
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadWordList();
    
    // Mark O? and CURVED features as completed by default
    document.getElementById('oFeature').classList.add('completed');
    document.getElementById('curvedFeature').classList.add('completed');
    
    // Hide O? and CURVED features initially
    document.getElementById('oFeature').style.display = 'none';
    document.getElementById('curvedFeature').style.display = 'none';
    
    // Show consonant question first
    document.getElementById('consonantQuestion').style.display = 'block';
    
    // Mode toggle listener
    document.getElementById('modeToggle').addEventListener('change', toggleMode);
    
    // Feature toggle listeners
    document.getElementById('lexiconToggle').addEventListener('change', () => toggleFeature('lexiconFeature'));
    document.getElementById('vowelToggle').addEventListener('change', () => toggleFeature('vowelFeature'));
    document.getElementById('shapeToggle').addEventListener('change', () => toggleFeature('shapeFeature'));
    
    // Share button listener
    document.getElementById('shareButton').addEventListener('click', exportWordlist);
    
    // Add skip button handler
    document.getElementById('lexiconSkipButton').addEventListener('click', () => {
        console.log('LEXICON feature skipped');
        document.getElementById('lexiconFeature').classList.add('completed');
        // Keep the current word list unchanged
        showNextFeature();
    });
    
    // COLOUR3 feature
    document.getElementById('lexiconYesBtn').addEventListener('click', () => {
        console.log('COLOUR3 YES selected');
        const filteredWords = filterWordsByColour3(currentFilteredWords);
        document.getElementById('lexiconFeature').classList.add('completed');
        displayResults(filteredWords);
        showNextFeature();
    });
    
    document.getElementById('lexiconSkipButton').addEventListener('click', () => {
        console.log('COLOUR3 SKIP selected');
        document.getElementById('lexiconFeature').classList.add('completed');
        showNextFeature();
    });
    
    // Consonant question buttons
    const consonantYesBtn = document.getElementById('consonantYesBtn');
    const consonantNoBtn = document.getElementById('consonantNoBtn');
    
    console.log('Setting up consonant question buttons');
    console.log('consonantYesBtn:', consonantYesBtn);
    console.log('consonantNoBtn:', consonantNoBtn);
    
    consonantYesBtn.addEventListener('click', () => {
        console.log('Consonant question: YES selected');
        console.log('Current word list length:', currentFilteredWords.length);
        hasAdjacentConsonants = true;
        
        // Filter to keep ONLY words that have adjacent consonants
        const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
        const filteredWords = currentFilteredWords.filter(word => {
            const wordLower = word.toLowerCase();
            for (let i = 0; i < wordLower.length - 1; i++) {
                const currentChar = wordLower[i];
                const nextChar = wordLower[i + 1];
                if (!vowels.has(currentChar) && !vowels.has(nextChar)) {
                    console.log(`Keeping word "${word}" - has adjacent consonants "${currentChar}${nextChar}"`);
                    return true;
                }
            }
            console.log(`Removing word "${word}" - no adjacent consonants`);
            return false;
        });
        
        console.log('Before filtering:', currentFilteredWords.length, 'words');
        currentFilteredWords = filteredWords;
        console.log('After filtering (keeping only words with adjacent consonants):', currentFilteredWords.length, 'words');
        
        // Update the display immediately
        displayResults(currentFilteredWords);
        
        // Hide consonant question and show Position 1
        document.getElementById('consonantQuestion').style.display = 'none';
        document.getElementById('position1Feature').style.display = 'block';
    });

    consonantNoBtn.addEventListener('click', () => {
        console.log('Consonant question: NO selected');
        console.log('Current word list length:', currentFilteredWords.length);
        hasAdjacentConsonants = false;
        
        // Filter to keep ONLY words that do NOT have adjacent consonants
        const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
        const filteredWords = currentFilteredWords.filter(word => {
            const wordLower = word.toLowerCase();
            for (let i = 0; i < wordLower.length - 1; i++) {
                const currentChar = wordLower[i];
                const nextChar = wordLower[i + 1];
                if (!vowels.has(currentChar) && !vowels.has(nextChar)) {
                    console.log(`Removing word "${word}" - has adjacent consonants "${currentChar}${nextChar}"`);
                    return false;
                }
            }
            console.log(`Keeping word "${word}" - no adjacent consonants`);
            return true;
        });
        
        console.log('Before filtering:', currentFilteredWords.length, 'words');
        currentFilteredWords = filteredWords;
        console.log('After filtering (keeping only words without adjacent consonants):', currentFilteredWords.length, 'words');
        
        // Update the display immediately
        displayResults(currentFilteredWords);
        
        // Hide consonant question and show Position 1
        document.getElementById('consonantQuestion').style.display = 'none';
        document.getElementById('position1Feature').style.display = 'block';
    });
    
    // Position 1 feature
    document.getElementById('position1Button').addEventListener('click', () => {
        const input = document.getElementById('position1Input').value.trim();
        if (input) {
            const consonants = getConsonantsInOrder(input);
            console.log('Processing Position 1 input:', input);
            console.log('Found consonants:', consonants);
            
            if (consonants.length >= 2) {
                let filteredWords;
                
                if (hasAdjacentConsonants) {
                    // YES to Consonants Together: look for the specific consonant pairs together
                    filteredWords = currentFilteredWords.filter(word => {
                        const wordLower = word.toLowerCase();
                        
                        // Create all possible pairs of consonants from the input word
                        const consonantPairs = [];
                        for (let i = 0; i < consonants.length; i++) {
                            for (let j = i + 1; j < consonants.length; j++) {
                                consonantPairs.push([consonants[i], consonants[j]]);
                            }
                        }
                        
                        console.log(`Checking word "${wordLower}" for consonant pairs:`, consonantPairs);
                        
                        // Check if any of the consonant pairs appear together in the word
                        for (const [con1, con2] of consonantPairs) {
                            const pair1 = con1 + con2;
                            const pair2 = con2 + con1;
                            if (wordLower.includes(pair1) || wordLower.includes(pair2)) {
                                console.log(`Word "${wordLower}" accepted: found consonant pair "${pair1}" or "${pair2}"`);
                                return true;
                            }
                        }
                        
                        console.log(`Word "${wordLower}" rejected: no matching consonant pairs found`);
                        return false;
                    });
                } else {
                    // NO to Consonants Together: look for ANY pair of consonants in middle 5/6 characters
                    filteredWords = currentFilteredWords.filter(word => {
                        const wordLower = word.toLowerCase();
                        const wordLength = wordLower.length;
                        
                        // Determine middle section length (5 for odd, 6 for even)
                        const middleLength = wordLength % 2 === 0 ? 6 : 5;
                        const startPos = Math.floor((wordLength - middleLength) / 2);
                        const middleSection = wordLower.slice(startPos, startPos + middleLength);
                        
                        console.log(`Word "${wordLower}": middle section "${middleSection}"`);
                        
                        // Create all possible pairs of consonants from the input word
                        const consonantPairs = [];
                        for (let i = 0; i < consonants.length; i++) {
                            for (let j = i + 1; j < consonants.length; j++) {
                                consonantPairs.push([consonants[i], consonants[j]]);
                            }
                        }
                        
                        // Check if ANY pair of consonants appears in the middle section
                        for (const [con1, con2] of consonantPairs) {
                            if (middleSection.includes(con1) && middleSection.includes(con2)) {
                                console.log(`Word "${wordLower}" accepted: found consonants "${con1}" and "${con2}" in middle section`);
                                return true;
                            }
                        }
                        
                        console.log(`Word "${wordLower}" rejected: no consonant pairs found in middle section`);
                        return false;
                    });
                }
                
                console.log('Filtered words count:', filteredWords.length);
                
                // Update the current filtered words
                currentFilteredWords = filteredWords;
                
                // Mark Position 1 as completed and update the display
                document.getElementById('position1Feature').classList.add('completed');
                document.getElementById('position1Feature').style.display = 'none';
                displayResults(filteredWords);
                
                // Get vowels from the input word in left-to-right order
                const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
                const inputLower = input.toLowerCase();
                uniqueVowels = [];
                
                // Collect vowels in order of appearance
                for (let i = 0; i < inputLower.length; i++) {
                    const char = inputLower[i];
                    if (vowels.has(char)) {
                        uniqueVowels.push(char);
                    }
                }
                
                console.log('Input word:', input);
                console.log('Vowels collected in order:', uniqueVowels);
                
                // Initialize vowel processing with the filtered words
                currentFilteredWordsForVowels = [...filteredWords];
                originalFilteredWords = [...filteredWords];
                currentVowelIndex = 0;
                
                // Move to VOWEL feature
                if (isVowelMode) {
                    console.log('Moving to VOWEL feature');
                    const vowelFeature = document.getElementById('vowelFeature');
                    vowelFeature.style.display = 'block';
                    
                    // Set up the vowel display
                    const vowelLetter = vowelFeature.querySelector('.vowel-letter');
                    if (uniqueVowels.length > 0) {
                        console.log('Setting first vowel letter to:', uniqueVowels[0].toUpperCase());
                        vowelLetter.textContent = uniqueVowels[0].toUpperCase();
                        vowelLetter.style.display = 'inline-block';
                    }
                } else {
                    showNextFeature();
                }
            } else {
                console.log('Not enough consonants found in input');
            }
        }
    });
    
    // Vowel feature buttons
    document.querySelector('#vowelFeature .yes-btn').addEventListener('click', () => {
        console.log('Vowel YES button clicked');
        handleVowelSelection(true);
    });
    
    document.querySelector('#vowelFeature .no-btn').addEventListener('click', () => {
        console.log('Vowel NO button clicked');
        handleVowelSelection(false);
    });
    
    // Reset button - full page refresh
    document.getElementById('resetButton').addEventListener('click', () => {
        window.location.reload();
    });
    
    // Settings button
    document.getElementById('settingsButton').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'block';
    });
    
    // Close settings
    document.querySelector('.close-button').addEventListener('click', () => {
        document.getElementById('settingsModal').style.display = 'none';
    });
    
    // Close settings when clicking outside
    window.onclick = function(event) {
        const modal = document.getElementById('settingsModal');
        if (event.target === modal) {
            modal.style.display = 'none';
        }
    };
    
    document.getElementById('position1Input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('position1Button').click();
        }
    });

    // O? feature buttons
    document.getElementById('oYesBtn').addEventListener('click', () => {
        console.log('O? YES selected');
        hasO = true;
        
        // Filter to keep ONLY words that have 'O'
        const filteredWords = currentFilteredWords.filter(word => {
            const hasLetterO = word.toLowerCase().includes('o');
            if (hasLetterO) {
                console.log(`Keeping word "${word}" - has O`);
            } else {
                console.log(`Removing word "${word}" - no O`);
            }
            return hasLetterO;
        });
        
        console.log('Before filtering:', currentFilteredWords.length, 'words');
        currentFilteredWords = filteredWords;
        console.log('After filtering (keeping only words with O):', currentFilteredWords.length, 'words');
        
        // Update the display immediately
        displayResults(currentFilteredWords);
        document.getElementById('oFeature').classList.add('completed');
        showNextFeature();
    });

    document.getElementById('oNoBtn').addEventListener('click', () => {
        console.log('O? NO selected');
        hasO = false;
        
        // Filter to keep ONLY words that do NOT have 'O'
        const filteredWords = currentFilteredWords.filter(word => {
            const hasLetterO = word.toLowerCase().includes('o');
            if (!hasLetterO) {
                console.log(`Keeping word "${word}" - no O`);
            } else {
                console.log(`Removing word "${word}" - has O`);
            }
            return !hasLetterO;
        });
        
        console.log('Before filtering:', currentFilteredWords.length, 'words');
        currentFilteredWords = filteredWords;
        console.log('After filtering (keeping only words without O):', currentFilteredWords.length, 'words');
        
        // Update the display immediately
        displayResults(currentFilteredWords);
        document.getElementById('oFeature').classList.add('completed');
        showNextFeature();
    });

    document.getElementById('oSkipBtn').addEventListener('click', () => {
        console.log('O? SKIP selected');
        document.getElementById('oFeature').classList.add('completed');
        showNextFeature();
    });

    // CURVED feature buttons
    document.querySelectorAll('.curved-btn').forEach(button => {
        button.addEventListener('click', () => {
            const letter = button.textContent;
            console.log('Curved letter selected:', letter);
            selectedCurvedLetter = letter;
            
            // Filter to keep ONLY words that have the selected letter
            const filteredWords = currentFilteredWords.filter(word => {
                const hasLetter = word.toLowerCase().includes(letter.toLowerCase());
                if (hasLetter) {
                    console.log(`Keeping word "${word}" - has ${letter}`);
                } else {
                    console.log(`Removing word "${word}" - no ${letter}`);
                }
                return hasLetter;
            });
            
            console.log('Before filtering:', currentFilteredWords.length, 'words');
            currentFilteredWords = filteredWords;
            console.log('After filtering (keeping only words with ' + letter + '):', currentFilteredWords.length, 'words');
            
            // Update the display immediately
            displayResults(currentFilteredWords);
            document.getElementById('curvedFeature').classList.add('completed');
            document.getElementById('curvedFeature').style.display = 'none';
            
            // Show consonant question
            document.getElementById('consonantQuestion').style.display = 'block';
        });
    });

    document.getElementById('curvedSkipBtn').addEventListener('click', () => {
        console.log('CURVED SKIP selected');
        document.getElementById('curvedFeature').classList.add('completed');
        document.getElementById('curvedFeature').style.display = 'none';
        
        // Show consonant question
        document.getElementById('consonantQuestion').style.display = 'block';
    });
});

// Function to check if a letter is curved
function isCurvedLetter(letter) {
    if (!letter) return false;
    letter = letter.toUpperCase();
    return letterShapes.curved.has(letter);
}

// Function to filter words by curved letter positions
function filterWordsByCurvedPositions(words, positions) {
    // Special case: if input is "0", filter for words with all straight letters in first 5 positions
    if (positions === "0") {
        return words.filter(word => {
            // Check first 5 positions (or word length if shorter)
            for (let i = 0; i < Math.min(5, word.length); i++) {
                if (isCurvedLetter(word[i])) {
                    return false; // Reject if any curved letter found
                }
            }
            return true; // Keep if all letters are straight
        });
    }

    // Convert positions string to array of numbers and validate
    const positionArray = positions.split('')
        .map(Number)
        .filter(pos => pos >= 1 && pos <= 5); // Only allow positions 1-5
    
    if (positionArray.length === 0) {
        console.log('No valid positions provided');
        return words;
    }
    
    return words.filter(word => {
        // Skip words shorter than the highest required position
        const maxPosition = Math.max(...positionArray);
        if (word.length < maxPosition) {
            return false;
        }
        
        // Check each position from 1 to 5
        for (let i = 0; i < 5; i++) {
            const pos = i + 1; // Convert to 1-based position
            const letter = word[i];
            
            // Skip if we've reached the end of the word
            if (!letter) {
                continue;
            }
            
            if (positionArray.includes(pos)) {
                // This position should have a curved letter
                if (!isCurvedLetter(letter)) {
                    return false;
                }
            } else {
                // This position should have a straight letter
                if (isCurvedLetter(letter)) {
                    return false;
                }
            }
        }
        
        return true;
    });
} 
