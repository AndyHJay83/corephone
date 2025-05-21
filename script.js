let wordList = [];
let totalWords = 0;
let isNewMode = true;
let isColour3Mode = true;
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
let eeeCompleted = false;
let lexiconCompleted = false;
let originalLexCompleted = false;
let originalLexPosition = -1;

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
        vowelLetter.style.display = 'inline-block';
    } else {
        // No more vowels to process, mark as completed and move to next feature
        document.getElementById('vowelFeature').classList.add('completed');
        // Update currentFilteredWords with the vowel-filtered results
        currentFilteredWords = [...currentFilteredWordsForVowels];
        console.log('Vowel feature completed, moving to O? feature');
        
        // Hide vowel feature and show O? feature
        document.getElementById('vowelFeature').style.display = 'none';
        document.getElementById('oFeature').style.display = 'block';
    }
}

// Function to filter words by EEE? feature
function filterWordsByEee(words, mode) {
    console.log('Filtering words by EEE? mode:', mode);
    console.log('Total words before filtering:', words.length);
    
    const filteredWords = words.filter(word => {
        if (word.length < 2) return false;
        
        const secondChar = word[1].toUpperCase();
        console.log(`Word: ${word}, Second character: ${secondChar}`);
        
        switch(mode) {
            case 'E':
                const hasE = secondChar === 'E';
                console.log(`Word ${word} ${hasE ? 'KEEP' : 'REMOVE'}: Second character ${secondChar} ${hasE ? 'is' : 'is not'} E`);
                return hasE;
                
            case 'YES':
                const yesLetters = new Set(['B', 'C', 'D', 'G', 'P', 'T', 'V', 'Z']);
                const hasYesLetter = yesLetters.has(secondChar);
                console.log(`Word ${word} ${hasYesLetter ? 'KEEP' : 'REMOVE'}: Second character ${secondChar} ${hasYesLetter ? 'is' : 'is not'} in YES set`);
                return hasYesLetter;
                
            case 'NO':
                const noLetters = new Set(['B', 'C', 'D', 'G', 'P', 'T', 'V', 'Z']);
                const hasNoLetter = noLetters.has(secondChar);
                console.log(`Word ${word} ${!hasNoLetter ? 'KEEP' : 'REMOVE'}: Second character ${secondChar} ${hasNoLetter ? 'is' : 'is not'} in NO set`);
                return !hasNoLetter;
        }
    });
    
    console.log('Filtering Summary:');
    console.log('Words before filtering:', words.length);
    console.log('Words after filtering:', filteredWords.length);
    console.log('Removed words:', words.length - filteredWords.length);
    
    return filteredWords;
}

// Function to filter words by LEXICON feature
function filterWordsByLexicon(words, positions) {
    console.log('Filtering words by LEXICON positions:', positions);
    console.log('Total words before filtering:', words.length);
    
    const curvedLetters = new Set(['B', 'C', 'D', 'G', 'J', 'O', 'P', 'Q', 'R', 'S', 'U']);
    
    // Special case: if input is "0", filter for words with all straight letters in first 5 positions
    if (positions === "0") {
        const filteredWords = words.filter(word => {
            // Check first 5 positions (or word length if shorter)
            for (let i = 0; i < Math.min(5, word.length); i++) {
                if (curvedLetters.has(word[i].toUpperCase())) {
                    console.log(`Word ${word} REMOVED: Position ${i + 1} has curved letter ${word[i]}`);
                    return false;
                }
            }
            console.log(`Word ${word} KEPT: All first 5 positions have straight letters`);
            return true;
        });
        
        console.log('Filtering Summary (0 case):');
        console.log('Words before filtering:', words.length);
        console.log('Words after filtering:', filteredWords.length);
        console.log('Removed words:', words.length - filteredWords.length);
        
        return filteredWords;
    }
    
    // Convert positions string to array of numbers
    const positionArray = positions.split('').map(Number);
    console.log('Processing positions:', positionArray);
    
    const filteredWords = words.filter(word => {
        // Skip words shorter than 5 characters
        if (word.length < 5) {
            console.log(`Word ${word} REMOVED: Too short (length ${word.length})`);
            return false;
        }
        
        // Check each position from 1 to 5
        for (let i = 0; i < 5; i++) {
            const pos = i + 1; // Convert to 1-based position
            const letter = word[i].toUpperCase();
            const isCurved = curvedLetters.has(letter);
            
            if (positionArray.includes(pos)) {
                // This position should have a curved letter
                if (!isCurved) {
                    console.log(`Word ${word} REMOVED: Position ${pos} has straight letter ${letter}`);
                    return false;
                }
            } else {
                // This position should have a straight letter
                if (isCurved) {
                    console.log(`Word ${word} REMOVED: Position ${pos} has curved letter ${letter}`);
                    return false;
                }
            }
        }
        
        console.log(`Word ${word} KEPT: All positions match requirements`);
        return true;
    });
    
    console.log('Filtering Summary:');
    console.log('Words before filtering:', words.length);
    console.log('Words after filtering:', filteredWords.length);
    console.log('Removed words:', words.length - filteredWords.length);
    
    return filteredWords;
}

// Function to find position with most variance
function findPositionWithMostVariance(words) {
    console.log('Finding position with most variance in words:', words);
    
    // Initialize array to store unique letters for each position
    const positionLetters = Array(5).fill().map(() => new Set());
    
    // Collect unique letters for each position
    words.forEach(word => {
        for (let i = 0; i < Math.min(5, word.length); i++) {
            positionLetters[i].add(word[i].toUpperCase());
        }
    });
    
    // Find position with most unique letters
    let maxVariance = -1;
    let result = -1;
    let resultLetters = [];
    
    positionLetters.forEach((letters, index) => {
        const uniqueLetters = Array.from(letters).sort();
        console.log(`Position ${index + 1} has ${letters.size} unique letters:`, uniqueLetters);
        if (letters.size > maxVariance) {
            maxVariance = letters.size;
            result = index;
            resultLetters = uniqueLetters;
        }
    });
    
    console.log('Selected position:', result + 1, 'with variance:', maxVariance, 'letters:', resultLetters);
    return {
        position: result,
        letters: resultLetters
    };
}

// Function to filter words by original lex
function filterWordsByOriginalLex(words, position, letter) {
    console.log('Filtering words by ORIGINAL LEX:', { position, letter });
    console.log('Total words before filtering:', words.length);
    
    const filteredWords = words.filter(word => {
        if (word.length <= position) {
            console.log(`Word ${word} REMOVED: Too short for position ${position + 1}`);
            return false;
        }
        
        const wordLetter = word[position].toUpperCase();
        const matches = wordLetter === letter.toUpperCase();
        
        if (matches) {
            console.log(`Word ${word} KEPT: Position ${position + 1} has ${letter}`);
        } else {
            console.log(`Word ${word} REMOVED: Position ${position + 1} has ${wordLetter} instead of ${letter}`);
        }
        
        return matches;
    });
    
    console.log('Filtering Summary:');
    console.log('Words before filtering:', words.length);
    console.log('Words after filtering:', filteredWords.length);
    console.log('Removed words:', words.length - filteredWords.length);
    
    return filteredWords;
}

// Function to show next feature
function showNextFeature() {
    console.log('Showing next feature...');
    console.log('Current states:', {
        originalLexCompleted,
        eeeCompleted,
        lexiconCompleted,
        hasAdjacentConsonants,
        isVowelMode,
        isColour3Mode,
        isShapeMode,
        position1Completed: document.getElementById('position1Feature').classList.contains('completed'),
        vowelCompleted: document.getElementById('vowelFeature').classList.contains('completed'),
        colour3Completed: document.getElementById('colour3Feature').classList.contains('completed'),
        shapeCompleted: document.getElementById('shapeFeature').classList.contains('completed'),
        oCompleted: document.getElementById('oFeature').classList.contains('completed'),
        curvedCompleted: document.getElementById('curvedFeature').classList.contains('completed')
    });
    
    // First hide all features
    const allFeatures = [
        'originalLexFeature',
        'eeeFeature',
        'lexiconFeature',
        'consonantQuestion',
        'position1Feature',
        'vowelFeature',
        'colour3Feature',
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
    else if (!document.getElementById('oFeature').classList.contains('completed')) {
        console.log('Showing O? feature');
        document.getElementById('oFeature').style.display = 'block';
    }
    else if (!lexiconCompleted) {
        console.log('Showing LEXICON feature');
        document.getElementById('lexiconFeature').style.display = 'block';
    }
    else if (!originalLexCompleted) {
        console.log('Showing ORIGINAL LEX feature');
        const originalLexFeature = document.getElementById('originalLexFeature');
        originalLexFeature.style.display = 'block';
        
        // Find position with most variance if not already found
        if (originalLexPosition === -1) {
            const result = findPositionWithMostVariance(currentFilteredWords);
            originalLexPosition = result.position;
            
            // Update the display
            document.getElementById('originalLexPosition').textContent = originalLexPosition + 1;
            document.getElementById('originalLexLetters').textContent = result.letters.join(', ');
        }
    }
    else if (!eeeCompleted) {
        console.log('Showing EEE? feature');
        document.getElementById('eeeFeature').style.display = 'block';
    }
    else if (isColour3Mode && !document.getElementById('colour3Feature').classList.contains('completed')) {
        console.log('Showing COLOUR3 feature');
        const colour3Feature = document.getElementById('colour3Feature');
        colour3Feature.style.display = 'block';
    }
    else if (isShapeMode && !document.getElementById('shapeFeature').classList.contains('completed')) {
        console.log('Showing SHAPE feature');
        document.getElementById('shapeFeature').style.display = 'block';
        updateShapeDisplay(currentFilteredWords);
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
    
    // Group similar words
    const { representativeWords, displayWords } = groupSimilarWords(words);
    
    // Display representative words
    displayWords.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-item representative-word';
        wordElement.textContent = word.toUpperCase();
        
        // Add click handler to show group
        wordElement.onclick = () => {
            const groupWords = representativeWords.get(word);
            showWordGroupOverlay(groupWords);
        };
        
        resultsContainer.appendChild(wordElement);
    });
    
    // Add non-representative words
    words.forEach(word => {
        if (!displayWords.includes(word)) {
            const wordElement = document.createElement('div');
            wordElement.className = 'word-item';
            wordElement.textContent = word.toUpperCase();
            resultsContainer.appendChild(wordElement);
        }
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
        'colour3Feature',
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
    
    // Reset all input fields
    document.getElementById('position1Input').value = '';
    
    // Show the first feature (consonant question)
    document.getElementById('consonantQuestion').style.display = 'block';
    
    // Update word count
    updateWordCount(originalFilteredWords.length);
}

// Function to toggle mode
function toggleMode() {
    isNewMode = true; // Default to new mode
    resetApp();
}

// Function to toggle feature
function toggleFeature(featureId) {
    // Default all features to enabled
    isColour3Mode = true;
    isVowelMode = true;
    isShapeMode = true;
    
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
    console.log('COLOUR3 letters:', Array.from(colour3Letters));
    console.log('Total words before filtering:', words.length);
    
    const filteredWords = words.filter(word => {
        // Check only position 5 (0-based index 4)
        const pos5 = word.length > 4 ? word[4].toUpperCase() : null;
        
        // Detailed logging for debugging
        console.log(`\nAnalyzing word: ${word}`);
        console.log(`Word length: ${word.length}`);
        console.log(`Position 5 character: ${pos5}`);
        console.log(`Is character in COLOUR3 set? ${pos5 && colour3Letters.has(pos5)}`);
        
        // Check if position 5 has a letter from our set
        const hasColour3Letter = pos5 && colour3Letters.has(pos5);
        
        if (hasColour3Letter) {
            console.log(`KEEPING word "${word}" - Position 5 (${pos5}) matches COLOUR3 set`);
        } else {
            console.log(`REMOVING word "${word}" - Position 5 (${pos5}) does not match COLOUR3 set`);
        }
        
        return hasColour3Letter;
    });
    
    console.log('\nFiltering Summary:');
    console.log('Words before filtering:', words.length);
    console.log('Words after filtering:', filteredWords.length);
    console.log('Removed words:', words.length - filteredWords.length);
    
    return filteredWords;
}

// Function to filter words by O? feature
function filterWordsByO(words, includeO) {
    console.log('Filtering words by O? mode:', includeO ? 'YES' : 'NO');
    console.log('Total words before filtering:', words.length);
    
    const filteredWords = words.filter(word => {
        const hasO = word.toLowerCase().includes('o');
        return includeO ? hasO : !hasO;
    });
    
    console.log('Filtering Summary:');
    console.log('Words before filtering:', words.length);
    console.log('Words after filtering:', filteredWords.length);
    console.log('Removed words:', words.length - filteredWords.length);
    
    return filteredWords;
}

// Event Listeners
document.addEventListener('DOMContentLoaded', async () => {
    await loadWordList();
    
    // Mark CURVED feature as completed by default
    document.getElementById('curvedFeature').classList.add('completed');
    
    // Hide all features initially except Consonants Together
    const allFeatures = [
        'originalLexFeature',
        'eeeFeature',
        'lexiconFeature',
        'position1Feature',
        'vowelFeature',
        'colour3Feature',
        'shapeFeature',
        'oFeature',
        'curvedFeature'
    ];
    
    allFeatures.forEach(featureId => {
        document.getElementById(featureId).style.display = 'none';
    });
    
    // Show Consonants Together first
    document.getElementById('consonantQuestion').style.display = 'block';
    
    // Reset states
    originalLexCompleted = false;
    eeeCompleted = false;
    lexiconCompleted = false;
    originalLexPosition = -1;
    hasAdjacentConsonants = null;
    
    // Consonant question buttons
    const consonantYesBtn = document.getElementById('consonantYesBtn');
    const consonantNoBtn = document.getElementById('consonantNoBtn');
    
    console.log('Setting up consonant question buttons');
    console.log('consonantYesBtn:', consonantYesBtn);
    console.log('consonantNoBtn:', consonantNoBtn);
    
    if (consonantYesBtn) {
        consonantYesBtn.addEventListener('click', () => {
            console.log('Consonant question: YES button clicked');
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
    } else {
        console.error('Consonant YES button not found!');
    }

    if (consonantNoBtn) {
        consonantNoBtn.addEventListener('click', () => {
            console.log('Consonant question: NO button clicked');
            console.log('Current word list length:', currentFilteredWords.length);
            hasAdjacentConsonants = false;
            
            // Filter to keep ONLY words that do NOT have adjacent consonants
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            const filteredWords = currentFilteredWords.filter(word => {
                const wordLower = word.toLowerCase();
                let hasAdjacent = false;
                
                for (let i = 0; i < wordLower.length - 1; i++) {
                    const currentChar = wordLower[i];
                    const nextChar = wordLower[i + 1];
                    if (!vowels.has(currentChar) && !vowels.has(nextChar)) {
                        hasAdjacent = true;
                        break;
                    }
                }
                
                if (!hasAdjacent) {
                    console.log(`Keeping word "${word}" - no adjacent consonants`);
                    return true;
                } else {
                    console.log(`Removing word "${word}" - has adjacent consonants`);
                    return false;
                }
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
    } else {
        console.error('Consonant NO button not found!');
    }

    // ORIGINAL LEX feature
    document.getElementById('originalLexButton').addEventListener('click', function() {
        const input = document.getElementById('originalLexInput').value.trim();
        if (input) {
            console.log('ORIGINAL LEX input:', input);
            const firstLetter = input[0].toUpperCase();
            console.log('Using first letter:', firstLetter, 'for position:', originalLexPosition + 1);
            
            const filteredWords = filterWordsByOriginalLex(currentFilteredWords, originalLexPosition, firstLetter);
            originalLexCompleted = true;
            displayResults(filteredWords);
            
            // Hide ORIGINAL LEX and show EEE?
            document.getElementById('originalLexFeature').style.display = 'none';
            document.getElementById('eeeFeature').style.display = 'block';
        }
    });
    
    document.getElementById('originalLexSkipButton').addEventListener('click', () => {
        console.log('ORIGINAL LEX SKIP selected');
        originalLexCompleted = true;
        // Hide ORIGINAL LEX and show EEE?
        document.getElementById('originalLexFeature').style.display = 'none';
        document.getElementById('eeeFeature').style.display = 'block';
    });
    
    document.getElementById('originalLexInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('originalLexButton').click();
        }
    });
    
    // EEE? feature buttons
    document.getElementById('eeeButton').addEventListener('click', () => {
        console.log('EEE? E button clicked');
        const filteredWords = filterWordsByEee(currentFilteredWords, 'E');
        eeeCompleted = true;
        displayResults(filteredWords);
        // Hide EEE? and show LEXICON
        document.getElementById('eeeFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    document.getElementById('eeeYesBtn').addEventListener('click', () => {
        console.log('EEE? YES button clicked');
        const filteredWords = filterWordsByEee(currentFilteredWords, 'YES');
        eeeCompleted = true;
        displayResults(filteredWords);
        // Hide EEE? and show LEXICON
        document.getElementById('eeeFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    document.getElementById('eeeNoBtn').addEventListener('click', () => {
        console.log('EEE? NO button clicked');
        const filteredWords = filterWordsByEee(currentFilteredWords, 'NO');
        eeeCompleted = true;
        displayResults(filteredWords);
        // Hide EEE? and show LEXICON
        document.getElementById('eeeFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    // Share button listener
    document.getElementById('shareButton').addEventListener('click', exportWordlist);
    
    // COLOUR3 feature
    document.getElementById('colour3YesBtn').addEventListener('click', () => {
        console.log('COLOUR3 YES selected');
        const filteredWords = filterWordsByColour3(currentFilteredWords);
        document.getElementById('colour3Feature').classList.add('completed');
        displayResults(filteredWords);
        showNextFeature();
    });
    
    document.getElementById('colour3SkipButton').addEventListener('click', () => {
        console.log('COLOUR3 SKIP selected');
        document.getElementById('colour3Feature').classList.add('completed');
        showNextFeature();
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
                console.log('Not enough consonants found in input');
            }
        } else {
            // If no input, just move to VOWEL feature
            console.log('No input provided, moving to VOWEL feature');
            document.getElementById('position1Feature').classList.add('completed');
            document.getElementById('position1Feature').style.display = 'none';
            
            // Move to VOWEL feature
            const vowelFeature = document.getElementById('vowelFeature');
            vowelFeature.style.display = 'block';
            
            // Initialize vowel processing with current words
            currentFilteredWordsForVowels = [...currentFilteredWords];
            originalFilteredWords = [...currentFilteredWords];
            currentVowelIndex = 0;
            
            // Get unique vowels from current word list
            const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
            uniqueVowels = Array.from(new Set(
                currentFilteredWords.join('').toLowerCase().split('')
                    .filter(char => vowels.has(char))
            ));
            
            // Set up the vowel display
            const vowelLetter = vowelFeature.querySelector('.vowel-letter');
            if (uniqueVowels.length > 0) {
                console.log('Setting first vowel letter to:', uniqueVowels[0].toUpperCase());
                vowelLetter.textContent = uniqueVowels[0].toUpperCase();
                vowelLetter.style.display = 'inline-block';
            }
        }
    });

    // Position 1 DONE button
    document.getElementById('position1DoneButton').addEventListener('click', () => {
        console.log('Position 1 DONE button clicked');
        // Mark Position 1 as completed
        document.getElementById('position1Feature').classList.add('completed');
        document.getElementById('position1Feature').style.display = 'none';
        
        // Move to VOWEL feature
        console.log('Moving to VOWEL feature');
        const vowelFeature = document.getElementById('vowelFeature');
        vowelFeature.style.display = 'block';
        
        // Initialize vowel processing with current words
        currentFilteredWordsForVowels = [...currentFilteredWords];
        originalFilteredWords = [...currentFilteredWords];
        currentVowelIndex = 0;
        
        // Get unique vowels from current word list
        const vowels = new Set(['a', 'e', 'i', 'o', 'u']);
        uniqueVowels = Array.from(new Set(
            currentFilteredWords.join('').toLowerCase().split('')
                .filter(char => vowels.has(char))
        ));
        
        // Set up the vowel display
        const vowelLetter = vowelFeature.querySelector('.vowel-letter');
        if (uniqueVowels.length > 0) {
            console.log('Setting first vowel letter to:', uniqueVowels[0].toUpperCase());
            vowelLetter.textContent = uniqueVowels[0].toUpperCase();
            vowelLetter.style.display = 'inline-block';
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

    // LEXICON feature
    document.getElementById('lexiconButton').addEventListener('click', () => {
        const input = document.getElementById('lexiconInput').value.trim();
        if (input) {
            console.log('LEXICON input:', input);
            const filteredWords = filterWordsByLexicon(currentFilteredWords, input);
            lexiconCompleted = true;
            displayResults(filteredWords);
            // Hide LEXICON and show next feature
            document.getElementById('lexiconFeature').style.display = 'none';
            showNextFeature();
        }
    });

    document.getElementById('lexiconSkipButton').addEventListener('click', () => {
        console.log('LEXICON SKIP selected');
        lexiconCompleted = true;
        // Hide LEXICON and show next feature
        document.getElementById('lexiconFeature').style.display = 'none';
        showNextFeature();
    });

    // Enter key handlers
    document.getElementById('position1Input').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('position1Button').click();
        }
    });

    document.getElementById('lexiconInput').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            document.getElementById('lexiconButton').click();
        }
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

    // O? feature buttons
    document.getElementById('oYesBtn').addEventListener('click', () => {
        console.log('O? YES selected');
        const filteredWords = filterWordsByO(currentFilteredWords, true);
        document.getElementById('oFeature').classList.add('completed');
        displayResults(filteredWords);
        // Hide O? and show LEXICON
        document.getElementById('oFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    document.getElementById('oNoBtn').addEventListener('click', () => {
        console.log('O? NO selected');
        const filteredWords = filterWordsByO(currentFilteredWords, false);
        document.getElementById('oFeature').classList.add('completed');
        displayResults(filteredWords);
        // Hide O? and show LEXICON
        document.getElementById('oFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
    });
    
    document.getElementById('oSkipBtn').addEventListener('click', () => {
        console.log('O? SKIP selected');
        document.getElementById('oFeature').classList.add('completed');
        // Hide O? and show LEXICON
        document.getElementById('oFeature').style.display = 'none';
        document.getElementById('lexiconFeature').style.display = 'block';
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

// Word categories mapping
const wordCategories = {
    // Food and drink
    food: new Set(['PIZZA', 'PASTA', 'BURGER', 'SANDWICH', 'SALAD', 'SOUP', 'STEW', 'CAKE', 'BREAD', 'COFFEE', 'TEA', 'WINE', 'BEER']),
    // Elements and chemistry
    element: new Set(['CARBON', 'OXYGEN', 'NITROGEN', 'HYDROGEN', 'SILVER', 'GOLD', 'IRON', 'COPPER']),
    // Transportation
    transport: new Set(['CARRIAGE', 'TRAIN', 'PLANE', 'BOAT', 'SHIP', 'TRUCK', 'BUS', 'TAXI']),
    // Buildings and structures
    building: new Set(['HOUSE', 'BUILDING', 'TOWER', 'BRIDGE', 'TUNNEL', 'GATE', 'WALL']),
    // Nature and environment
    nature: new Set(['RIVER', 'MOUNTAIN', 'FOREST', 'OCEAN', 'LAKE', 'STREAM', 'VALLEY']),
    // Animals
    animal: new Set(['LION', 'TIGER', 'ELEPHANT', 'GIRAFFE', 'MONKEY', 'DOLPHIN', 'WHALE']),
    // Plants
    plant: new Set(['TREE', 'FLOWER', 'GRASS', 'BUSH', 'VINE', 'LEAF', 'ROSE', 'LILY']),
    // Weather
    weather: new Set(['RAIN', 'STORM', 'CLOUD', 'WIND', 'SUN', 'SNOW', 'FROST', 'THUNDER']),
    // Time
    time: new Set(['YEAR', 'MONTH', 'WEEK', 'DAY', 'HOUR', 'MINUTE', 'SECOND']),
    // Body parts
    body: new Set(['HEAD', 'HAND', 'FOOT', 'ARM', 'LEG', 'EYE', 'EAR', 'NOSE', 'MOUTH']),
    // Clothing
    clothing: new Set(['SHIRT', 'PANTS', 'DRESS', 'SKIRT', 'JACKET', 'COAT', 'HAT', 'SHOES']),
    // Tools
    tool: new Set(['HAMMER', 'SCREWDRIVER', 'WRENCH', 'PLIERS', 'DRILL', 'SAW', 'AXE']),
    // Furniture
    furniture: new Set(['TABLE', 'CHAIR', 'SOFA', 'BED', 'DESK', 'SHELF', 'CABINET']),
    // Technology
    technology: new Set(['COMPUTER', 'PHONE', 'CAMERA', 'RADIO', 'TELEVISION', 'LAPTOP']),
    // Music
    music: new Set(['PIANO', 'GUITAR', 'DRUM', 'VIOLIN', 'FLUTE', 'TRUMPET', 'SAXOPHONE']),
    // Sports
    sport: new Set(['FOOTBALL', 'BASKETBALL', 'TENNIS', 'GOLF', 'SWIMMING', 'RUNNING']),
    // Colors
    color: new Set(['RED', 'BLUE', 'GREEN', 'YELLOW', 'PURPLE', 'ORANGE', 'BLACK', 'WHITE']),
    // Emotions
    emotion: new Set(['HAPPY', 'SAD', 'ANGRY', 'SCARED', 'EXCITED', 'WORRIED', 'CALM']),
    // Professions
    profession: new Set(['DOCTOR', 'TEACHER', 'LAWYER', 'ENGINEER', 'ARTIST', 'MUSICIAN']),
    // Places
    place: new Set(['CITY', 'TOWN', 'VILLAGE', 'COUNTRY', 'STATE', 'PROVINCE', 'REGION'])
};

// Function to get word category
function getWordCategory(word) {
    const upperWord = word.toUpperCase();
    
    // Check each category
    for (const [category, words] of Object.entries(wordCategories)) {
        // Check if the word starts with any of the category words
        for (const categoryWord of words) {
            if (upperWord.startsWith(categoryWord)) {
                return category;
            }
        }
    }
    
    return null; // No category found
}

// Function to check if words are in the same family
function areWordsInSameFamily(word1, word2) {
    // Get the first 5 characters of each word
    const prefix1 = word1.slice(0, 5).toLowerCase();
    const prefix2 = word2.slice(0, 5).toLowerCase();
    
    // Words must share the first 5 characters exactly
    if (prefix1 !== prefix2) {
        return false;
    }
    
    // Get categories for both words
    const category1 = getWordCategory(word1);
    const category2 = getWordCategory(word2);
    
    // Words must be in the same category
    return category1 !== null && category1 === category2;
}

// Function to group similar words
function groupSimilarWords(words) {
    const groups = new Map(); // Maps representative word to its group
    const processedWords = new Set();
    
    // Sort words by length (shorter first) and then alphabetically
    const sortedWords = [...words].sort((a, b) => {
        if (a.length === b.length) {
            return a.localeCompare(b);
        }
        return a.length - b.length;
    });
    
    // First pass: identify word families
    for (let i = 0; i < sortedWords.length; i++) {
        const word = sortedWords[i];
        
        // Skip if already processed
        if (processedWords.has(word)) continue;
        
        // Start a new group with this word
        const group = [word];
        processedWords.add(word);
        
        // Look for related words
        for (let j = i + 1; j < sortedWords.length; j++) {
            const otherWord = sortedWords[j];
            
            // Skip if already processed
            if (processedWords.has(otherWord)) continue;
            
            // Check if words are in the same family
            if (areWordsInSameFamily(word, otherWord)) {
                group.push(otherWord);
                processedWords.add(otherWord);
            }
        }
        
        // Only create a group if we found related words
        if (group.length > 1) {
            // Sort the group by length and then alphabetically
            group.sort((a, b) => {
                if (a.length === b.length) {
                    return a.localeCompare(b);
                }
                return a.length - b.length;
            });
            
            // Use the shortest word as the representative
            const representative = group[0];
            groups.set(representative, group);
        }
    }
    
    return {
        representativeWords: groups,
        displayWords: Array.from(groups.keys())
    };
}

// Function to create and show overlay
function showWordGroupOverlay(words) {
    // Create overlay container
    const overlay = document.createElement('div');
    overlay.className = 'word-group-overlay';
    
    // Create content container
    const content = document.createElement('div');
    content.className = 'word-group-content';
    
    // Add words to content
    words.forEach(word => {
        const wordElement = document.createElement('div');
        wordElement.className = 'word-group-item';
        wordElement.textContent = word;
        content.appendChild(wordElement);
    });
    
    // Add close button
    const closeButton = document.createElement('button');
    closeButton.className = 'word-group-close';
    closeButton.textContent = '×';
    closeButton.onclick = () => {
        document.body.removeChild(overlay);
    };
    
    // Assemble overlay
    content.appendChild(closeButton);
    overlay.appendChild(content);
    
    // Add click handler to close when clicking outside content
    overlay.onclick = (e) => {
        if (e.target === overlay) {
            document.body.removeChild(overlay);
        }
    };
    
    // Add to document
    document.body.appendChild(overlay);
}