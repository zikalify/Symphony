// --- PWA Registration ---
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js').then(reg => {
            console.log('Service Worker Registered');
        }).catch(err => console.log('SW Registration failed', err));
    });
}

// --- State Management ---
let currentDate = new Date();
const STORAGE_KEY = 'cycletracker_nfp_data';
const GOAL_KEY = 'cycletracker_goal';
const PREGNANT_KEY = 'cycletracker_pregnant';
let cycleData = JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
let userGoal = localStorage.getItem(GOAL_KEY) || 'avoid';
let isPregnant = localStorage.getItem(PREGNANT_KEY) === 'true';

// --- DOM Elements ---
const currentDateDisplay = document.getElementById('currentDateDisplay');
const prevBtn = document.getElementById('prevBtn');
const nextBtn = document.getElementById('nextBtn');
const sexIndicator = document.getElementById('sexIndicator');
const dailyForm = document.getElementById('dailyForm');
const bleedingGroup = document.getElementById('bleedingGroup');
const mucusGroup = document.getElementById('mucusGroup');
const goalGroup = document.getElementById('goalGroup');
const sexGroup = document.getElementById('sexGroup');
const pregnantGroup = document.getElementById('pregnantGroup');
const bbtInput = document.getElementById('bbtInput');
const insightMessage = document.getElementById('insightMessage');
const fertilityStatus = document.getElementById('fertilityStatus');
const fertilityIndicator = document.getElementById('fertilityIndicator');
const cycleDayDisplay = document.getElementById('cycleDayDisplay');
const cycleDayLabel = document.getElementById('cycleDayLabel');
const cyclePhaseDisplay = document.getElementById('cyclePhaseDisplay');
const avgCycleDisplay = document.getElementById('avgCycleDisplay');
const nextPeriodDisplay = document.getElementById('nextPeriodDisplay');
const nextPeriodLabel = document.getElementById('nextPeriodLabel');
const ovulationDisplay = document.getElementById('ovulationDisplay');
const sexCountDisplay = document.getElementById('sexCountDisplay');
const pregnancyDisplay = document.getElementById('pregnancyDisplay');
const fertileSexDisplay = document.getElementById('fertileSexDisplay');
const toast = document.getElementById('toast');
const exportBtn = document.getElementById('exportBtn');
const importInput = document.getElementById('importInput');

// --- Initialization ---
function init() {
    updateDateDisplay();
    loadDailyData();
    loadGoalSetting();
    loadPregnantSetting();
    analyzeCycle();
    setupEventListeners();
}

function loadGoalSetting() {
    setButtonGroupValue(goalGroup, userGoal);
}

function loadPregnantSetting() {
    setButtonGroupValue(pregnantGroup, String(isPregnant));
}

function formatDateKey(date) {
    const d = new Date(date);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

function getTodayKey() {
    return formatDateKey(new Date());
}

function updateDateDisplay() {
    const key = formatDateKey(currentDate);
    const todayKey = getTodayKey();

    if (key === todayKey) {
        currentDateDisplay.textContent = 'Today';
        nextBtn.disabled = true;
    } else {
        const options = { weekday: 'short', month: 'short', day: 'numeric' };
        currentDateDisplay.textContent = currentDate.toLocaleDateString(undefined, options);
        nextBtn.disabled = false;
    }

    // Show sex indicator if sex was logged on this day
    const dayData = cycleData[key];
    if (dayData?.hadSex === 'yes') {
        sexIndicator.classList.add('visible');
    } else {
        sexIndicator.classList.remove('visible');
    }
}

function setupEventListeners() {
    prevBtn.addEventListener('click', () => {
        currentDate.setDate(currentDate.getDate() - 1);
        handleDateChange();
    });

    nextBtn.addEventListener('click', () => {
        if (formatDateKey(currentDate) !== getTodayKey()) {
            currentDate.setDate(currentDate.getDate() + 1);
            handleDateChange();
        }
    });

    currentDateDisplay.addEventListener('click', () => {
        currentDate = new Date();
        handleDateChange();
    });

    // Custom Button Groups logic
    setupButtonGroup(bleedingGroup);
    setupButtonGroup(mucusGroup);
    setupButtonGroup(goalGroup);
    setupButtonGroup(sexGroup);

    // Goal change listener
    const goalButtons = goalGroup.querySelectorAll('.option-btn');
    goalButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            userGoal = getButtonGroupValue(goalGroup);
            localStorage.setItem(GOAL_KEY, userGoal);
            analyzeCycle();
        });
    });

    // Pregnant change listener
    setupButtonGroup(pregnantGroup);
    const pregnantButtons = pregnantGroup.querySelectorAll('.option-btn');
    pregnantButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            isPregnant = getButtonGroupValue(pregnantGroup) === 'true';
            localStorage.setItem(PREGNANT_KEY, String(isPregnant));
            analyzeCycle();
        });
    });

    // Form Submission
    dailyForm.addEventListener('submit', (e) => {
        e.preventDefault();
        saveDailyData();
    });

    if (exportBtn) {
        exportBtn.addEventListener('click', exportData);
    }
    if (importInput) {
        importInput.addEventListener('change', importData);
    }
}

function setupButtonGroup(groupElement) {
    const buttons = groupElement.querySelectorAll('.option-btn');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function handleDateChange() {
    updateDateDisplay();
    loadDailyData();
    analyzeCycle();
}

function loadDailyData() {
    const key = formatDateKey(currentDate);
    let data = cycleData[key] || { bleeding: 'unknown', mucus: 'unknown', bbt: '' };

    // Migrate old mucus values if necessary
    data.mucus = migrateMucusValue(data.mucus);

    // Set Bleeding
    setButtonGroupValue(bleedingGroup, data.bleeding);

    // Set Mucus
    setButtonGroupValue(mucusGroup, data.mucus);

    // Set Sex
    setButtonGroupValue(sexGroup, data.hadSex || 'no');

    // Set BBT
    bbtInput.value = data.bbt || '';
}

function setButtonGroupValue(groupElement, value) {
    const buttons = groupElement.querySelectorAll('.option-btn');
    let found = false;
    buttons.forEach(btn => {
        if (btn.dataset.value === value) {
            btn.classList.add('active');
            found = true;
        } else {
            btn.classList.remove('active');
        }
    });
    // Default to first if none found
    if (!found && buttons.length > 0) buttons[0].classList.add('active');
}

function getButtonGroupValue(groupElement) {
    const activeBtn = groupElement.querySelector('.option-btn.active');
    return activeBtn ? activeBtn.dataset.value : 'unknown';
}

function migrateMucusValue(value) {
    const mapping = {
        'none': 'dry',
        'sticky': 'damp',
        'creamy': 'damp',
        'watery': 'slippery',
        'eggwhite': 'slippery'
    };
    return mapping[value] || value;
}

function saveDailyData() {
    const key = formatDateKey(currentDate);

    const bleedingVal = getButtonGroupValue(bleedingGroup);
    const mucusVal = getButtonGroupValue(mucusGroup);
    const hadSexVal = getButtonGroupValue(sexGroup);
    let bbtVal = parseFloat(bbtInput.value);

    if (isNaN(bbtVal)) {
        bbtVal = null;
    } else if (bbtVal < 35.0 || bbtVal > 40.0) {
        showToast('Invalid BBT. Must be between 35 and 40°C.');
        return; // Reject invalid BBT
    }

    // Validate enums to prevent garbage data
    const validBleeding = ['unknown', 'none', 'spotting', 'light', 'medium', 'heavy'];
    const validMucus = ['unknown', 'dry', 'damp', 'slippery'];
    const validSex = ['yes', 'no'];

    const bleeding = validBleeding.includes(bleedingVal) ? bleedingVal : 'unknown';
    const mucus = validMucus.includes(mucusVal) ? mucusVal : 'unknown';
    const hadSex = validSex.includes(hadSexVal) ? hadSexVal : 'no';

    // Only delete the entry if it's completely "Unknown" and no BBT.
    // "None" (bleeding) and "Dry" (mucus) are valid observations that should be saved.
    const isBleedingUnknown = bleeding === 'unknown';
    const isMucusUnknown = mucus === 'unknown';
    const hadSexYes = hadSex === 'yes';

    if (isBleedingUnknown && isMucusUnknown && bbtVal === null && !hadSexYes) {
        if (cycleData[key]) {
            delete cycleData[key];
            showToast('Entry Cleared');
        }
    } else {
        cycleData[key] = { bleeding, mucus, bbt: bbtVal, hadSex };
        showToast('Entry Saved!');
    }

    localStorage.setItem(STORAGE_KEY, JSON.stringify(cycleData));

    analyzeCycle(); // Re-analyze after saving
}

function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}

// --- Doering Rule Helper ---
function getDoeringCutoff() {
    const sortedDates = Object.keys(cycleData).sort();
    const cycleStarts = [];
    
    // Find all cycle start dates (first day of full bleeding)
    for (let i = 0; i < sortedDates.length; i++) {
        const dateKey = sortedDates[i];
        const data = cycleData[dateKey];
        const prevDate = sortedDates[i - 1];
        const prevData = prevDate ? cycleData[prevDate] : null;
        
        const isFullBleeding = ['light', 'medium', 'heavy'].includes(data.bleeding);
        const wasBleeding = prevData && ['light', 'medium', 'heavy'].includes(prevData.bleeding);
        
        if (isFullBleeding && !wasBleeding) {
            cycleStarts.push(new Date(dateKey).getTime());
        }
    }
    
    if (cycleStarts.length < 2) return null; // Need at least 2 cycles
    
    // Calculate cycle lengths (days between consecutive starts)
    let shortestCycle = Infinity;
    for (let i = 1; i < cycleStarts.length; i++) {
        const days = Math.floor((cycleStarts[i] - cycleStarts[i - 1]) / (1000 * 60 * 60 * 24));
        if (days > 0 && days < shortestCycle) {
            shortestCycle = days;
        }
    }
    
    return shortestCycle !== Infinity ? shortestCycle - 20 : null;
}

// --- Cycle Stats Helper ---
function getMedian(values) {
    if (!values || values.length === 0) return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
        return sorted[mid];
    }
    return Math.round((sorted[mid - 1] + sorted[mid]) / 2);
}

function getCycleStats() {
    const sortedDates = Object.keys(cycleData).sort();
    const cycleStarts = [];
    
    for (let i = 0; i < sortedDates.length; i++) {
        const dateKey = sortedDates[i];
        const data = cycleData[dateKey];
        const prevDate = sortedDates[i - 1];
        const prevData = prevDate ? cycleData[prevDate] : null;
        
        const isFullBleeding = ['light', 'medium', 'heavy'].includes(data.bleeding);
        const wasBleeding = prevData && ['light', 'medium', 'heavy'].includes(prevData.bleeding);
        
        if (isFullBleeding) {
            let isCycleStart = false;
            
            if (!wasBleeding) {
                // Transition from non-bleeding to bleeding
                isCycleStart = true;
            } else if (prevDate) {
                // Check for a gap in logging (unlogged days between entries)
                const daysSinceLastLog = Math.floor((new Date(dateKey) - new Date(prevDate)) / (1000 * 60 * 60 * 24));
                if (daysSinceLastLog > 10) {
                    // Large gap suggests a new cycle (accounts for sparse data entry)
                    isCycleStart = true;
                }
            }
            
            if (isCycleStart) {
                cycleStarts.push(new Date(dateKey).getTime());
            }
        }
    }
    
    if (cycleStarts.length < 2) {
        return { median: null, shortest: null };
    }
    
    const cycleLengths = [];
    let shortest = Infinity;

    for (let i = 1; i < cycleStarts.length; i++) {
        const days = Math.floor((cycleStarts[i] - cycleStarts[i - 1]) / (1000 * 60 * 60 * 24));
        if (days > 0) {
            cycleLengths.push(days);
            if (days < shortest) shortest = days;
        }
    }

    const median = getMedian(cycleLengths);

    return {
        median: median,
        shortest: shortest !== Infinity ? shortest : null
    };
}

// --- Symptothermal Algorithm ---
function analyzeCycle() {
    const sortedDates = Object.keys(cycleData).sort();
    if (sortedDates.length === 0) {
        setInsight("Unknown", "Start logging data to get insights.", "var(--unknown)", "-", "-", "", { median: null, shortest: null }, "-", "-", 0, "-", "-");
        return;
    }

    const currentKey = formatDateKey(currentDate);
    const validDates = sortedDates.filter(d => d <= currentKey);

    if (validDates.length === 0) {
        setInsight("No Past Data", "No history available prior to this date.", "var(--unknown)", "-", "-", "", { median: null, shortest: null }, "-", "-", 0, "-", "-");
        return;
    }

    // Pregnancy mode: show pregnancy info instead of fertility status
    if (isPregnant) {
        // Find the last period start (cycleStartKey) to calculate due date
        // Use the same logic as regular cycle detection to find first day of contiguous bleeding
        let cycleStartKey = null;
        let isPeriodContext = false;

        for (let i = validDates.length - 1; i >= 0; i--) {
            const dateKey = validDates[i];
            const data = cycleData[dateKey];
            const isFullBleeding = ['light', 'medium', 'heavy'].includes(data.bleeding);
            const isSpotting = data.bleeding === 'spotting';

            if (isFullBleeding) {
                isPeriodContext = true;
                cycleStartKey = dateKey; // Keep shifting backwards while bleeding is contiguous to find day 1
            } else if (isSpotting && isPeriodContext) {
                break; // Spotting typically doesn't count as contiguous full flow Day 1
            } else if (isPeriodContext) {
                break;
            }
        }

        if (cycleStartKey) {
            const startDate = new Date(cycleStartKey);
            const dueDate = new Date(startDate.getTime() + 280 * 24 * 60 * 60 * 1000);
            const currentMs = currentDate.getTime();
            const daysPregnant = Math.floor((currentMs - startDate.getTime()) / (1000 * 60 * 60 * 24)) + 1;
            const weeksPregnant = Math.floor(daysPregnant / 7);
            const daysIntoWeek = daysPregnant % 7;

            const dueDateStr = dueDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
            const weeksText = `${weeksPregnant}w ${daysIntoWeek}d`;
            const daysUntilDue = Math.floor((dueDate.getTime() - currentMs) / (1000 * 60 * 60 * 24));
            const dueText = daysUntilDue > 0 ? `in ${daysUntilDue} days` : "Due today";

            cycleDayLabel.textContent = "Weeks Pregnant";
            nextPeriodLabel.textContent = "Giving Birth";
            setInsight("Pregnant", `Week ${weeksText}. Due ${dueDateStr}.`, "#e91e63", weeksText, "Pregnancy", "", { median: null, shortest: null }, dueText, "-", 0, "-", "-");
        } else {
            cycleDayLabel.textContent = "Weeks Pregnant";
            nextPeriodLabel.textContent = "Giving Birth";
            setInsight("Pregnant", "Log your last period start date to calculate due date.", "#e91e63", "-", "Pregnancy", "", { median: null, shortest: null }, "-", "-", 0, "-", "-");
        }
        return;
    }

    // Reset labels for non-pregnancy mode
    cycleDayLabel.textContent = "Cycle Day";
    nextPeriodLabel.textContent = "Next Period";

    // 1. Find the start of the current cycle (most recent period start relative to the viewed date)
    let cycleStartKey = null;
    let isPeriodContext = false;

    // Iterate backwards through valid dates. Full bleeding (light, medium, heavy) starts a cycle.
    for (let i = validDates.length - 1; i >= 0; i--) {
        const dateKey = validDates[i];
        const data = cycleData[dateKey];
        const isFullBleeding = ['light', 'medium', 'heavy'].includes(data.bleeding);
        const isSpotting = data.bleeding === 'spotting';

        if (isFullBleeding) {
            isPeriodContext = true;
            cycleStartKey = dateKey; // Keep shifting backwards while bleeding is contiguous to find day 1
        } else if (isSpotting && isPeriodContext) {
            break; // Spotting typically doesn't count as contiguous full flow Day 1
        } else if (isPeriodContext) {
            break;
        }
    }

    const currentMs = new Date(currentKey).getTime();
    let cycleDay = "-";
    let datesUpToCurrent = [];

    if (cycleStartKey) {
        const startMs = new Date(cycleStartKey).getTime();
        cycleDay = Math.floor((currentMs - startMs) / (1000 * 60 * 60 * 24)) + 1;
        datesUpToCurrent = sortedDates.filter(d => d >= cycleStartKey && d <= currentKey);
    } else {
        datesUpToCurrent = sortedDates.filter(d => d <= currentKey);
    }

    // Helper: days since a given date key relative to the current view date
    function daysSince(dateKey) {
        const ms = new Date(dateKey).getTime();
        return Math.floor((currentMs - ms) / (1000 * 60 * 60 * 24));
    }
    // Default todayData: Bleeding 'none' is a safe assumption for display for blank days, BUT
    // we use 'unknown' here to detect if the user has actually interacted with the day.
    const todayData = cycleData[currentKey] || { bleeding: 'unknown', mucus: 'unknown' };

    let isHighlyFertile = false;
    let isPotentiallyFertile = false;
    let ovulationConfirmed = checkBBTShift(datesUpToCurrent);
    const recentTemps = datesUpToCurrent.map(d => cycleData[d].bbt).filter(t => t !== null && !isNaN(t));
    const hasTempData = recentTemps.length > 0;

    // Lookback logic: Check for fertile mucus in the last 3 days
    let lastSlipperyKey = null;
    let lastDampKey = null;

    datesUpToCurrent.forEach(dateKey => {
        const data = cycleData[dateKey] || { mucus: 'unknown' };
        if (data.mucus === 'slippery') lastSlipperyKey = dateKey;
        if (data.mucus === 'damp') lastDampKey = dateKey;
    });

    if (lastSlipperyKey) {
        const lastMs = new Date(lastSlipperyKey).getTime();
        const diffDays = Math.floor((currentMs - lastMs) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) isHighlyFertile = true;
    }

    if (!isHighlyFertile && lastDampKey) {
        const lastMs = new Date(lastDampKey).getTime();
        const diffDays = Math.floor((currentMs - lastMs) / (1000 * 60 * 60 * 24));
        if (diffDays <= 3) isPotentiallyFertile = true;
    }

    // Check for consecutive dry days after period ends (early dry days)
    let consecutiveDryDays = 0;
    let isEarlyDryPhase = false;
    
    if (cycleStartKey && !isHighlyFertile && !isPotentiallyFertile) {
        // Count consecutive dry days backwards from current date
        for (let i = datesUpToCurrent.length - 1; i >= 0; i--) {
            const dateKey = datesUpToCurrent[i];
            const data = cycleData[dateKey];
            const isBleeding = ['light', 'medium', 'heavy', 'spotting'].includes(data.bleeding);
            
            if (isBleeding) {
                break; // Stop counting when we hit bleeding
            }
            
            if (data.mucus === 'dry') {
                consecutiveDryDays++;
            } else {
                break; // Stop if mucus is unknown, damp, or slippery
            }
        }
        
        // Check for recent fertile mucus
        const hasRecentFertileMucus = (lastSlipperyKey && daysSince(lastSlipperyKey) <= 5) ||
                                      (lastDampKey && daysSince(lastDampKey) <= 5);
        
        // Doering Rule: use shortest cycle - 20 as earliest possible ovulation cutoff
        const doeringCutoff = getDoeringCutoff();
        const beforeDoeringCutoff = doeringCutoff === null || cycleDay < doeringCutoff;
        
        // STM dry day rule: 3+ consecutive dry days after period, today must be dry, before Doering cutoff
        if (todayData.mucus === 'dry' && consecutiveDryDays >= 3 && cycleDay >= 6 && !hasRecentFertileMucus && beforeDoeringCutoff) {
            isEarlyDryPhase = true;
        }
    }

    // Determine Phase and Status
    let phase = "-";
    let statusText = "";
    let color = "var(--unknown)";
    let message = "";

    const isBleeding = ['light', 'medium', 'heavy', 'spotting'].includes(todayData.bleeding);

    if (isHighlyFertile) {
        phase = cycleStartKey ? "Follicular Phase" : "Unknown Phase";
        statusText = "High Fertility";
        color = "var(--fertile-high)";
        message = "Peak fertility.";
    } else if (isPotentiallyFertile) {
        phase = cycleStartKey ? "Follicular Phase" : "Unknown Phase";
        statusText = "Potentially Fertile";
        color = "var(--fertile-moderate)";
        message = "Fertility signs.";
    } else if (isEarlyDryPhase) {
        phase = "Follicular Phase";
        statusText = "Low Fertility";
        color = "var(--fertile-low)";
        message = "No fertility signs.";
    } else if (ovulationConfirmed) {
        phase = "Luteal Phase";
        statusText = "Low Fertility";
        color = "var(--fertile-low)";
        message = "Ovulation confirmed.";
    } else if (isBleeding && cycleDay <= 5) {
        phase = "Menstruation";
        statusText = "Low Fertility";
        color = "var(--period)";
        message = "Menstruation.";
    } else if (isBleeding && cycleDay > 5) {
        phase = "Follicular Phase";
        statusText = "Potentially Fertile";
        color = "var(--fertile-moderate)";
        message = "Bleeding.";
    } else {
        if (!cycleStartKey) {
            phase = "Unknown Phase";
            statusText = "Unknown";
            color = "var(--unknown)";
            message = "Need more data.";
        } else {
            phase = "Follicular Phase";
            statusText = "Potentially Fertile";
            color = "var(--fertile-moderate)";
            message = "Pre-ovulation.";
        }
    }

    // Compute cycle stats
    const cycleStats = getCycleStats();
    
    // Compute next predicted period
    let nextPeriodText = "-";
    if (cycleStartKey && cycleStats.median) {
        const startDate = new Date(cycleStartKey);
        const nextPeriod = new Date(startDate.getTime() + cycleStats.median * 24 * 60 * 60 * 1000);
        const daysUntil = Math.floor((nextPeriod.getTime() - currentMs) / (1000 * 60 * 60 * 24));
        if (daysUntil >= 0) {
            nextPeriodText = daysUntil === 0 ? "Today" : `In ${daysUntil}d`;
        }
    }
    
    // Compute ovulation display
    let ovulationText = "-";
    if (ovulationConfirmed) {
        ovulationText = "Confirmed";
    } else if (cycleStartKey && cycleStats.median) {
        const estimatedOvDay = cycleStats.median - 14;
        const startDate = new Date(cycleStartKey);
        const estimatedOvulation = new Date(startDate.getTime() + estimatedOvDay * 24 * 60 * 60 * 1000);
        const daysUntilOv = Math.floor((estimatedOvulation.getTime() - currentMs) / (1000 * 60 * 60 * 24));
        if (daysUntilOv >= 0) {
            ovulationText = daysUntilOv === 0 ? "Today" : `In ${daysUntilOv}d`;
        }
    }
    
    // Check if sex occurred yesterday (for every-other-day conception advice)
    const yesterday = new Date(currentDate);
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayKey = formatDateKey(yesterday);
    const hadSexYesterday = cycleData[yesterdayKey]?.hadSex === 'yes';

    // Count sex days in current cycle
    let sexCount = 0;
    let fertileDays = 0;
    let sexOnFertileDays = 0;
    if (cycleStartKey) {
        const cycleDates = validDates.filter(d => d >= cycleStartKey);
        for (const d of cycleDates) {
            const data = cycleData[d] || {};
            if (data.hadSex === 'yes') sexCount++;
            
            // Check if this day was fertile (fertile mucus or within 3-day window)
            const isFertileMucus = ['damp', 'slippery'].includes(data.mucus);
            if (isFertileMucus) {
                fertileDays++;
                if (data.hadSex === 'yes') sexOnFertileDays++;
            }
        }
        
        // Count 3-day window days as fertile
        if (lastSlipperyKey || lastDampKey) {
            const lastFertileMs = new Date(lastSlipperyKey || lastDampKey).getTime();
            for (const d of cycleDates) {
                const dayMs = new Date(d).getTime();
                const diffDays = Math.floor((dayMs - lastFertileMs) / (1000 * 60 * 60 * 24));
                if (diffDays > 0 && diffDays <= 3) {
                    const data = cycleData[d] || {};
                    if (!['damp', 'slippery'].includes(data.mucus)) {
                        fertileDays++;
                        if (data.hadSex === 'yes') sexOnFertileDays++;
                    }
                }
            }
        }
    }
    
    const fertileSexText = fertileDays > 0 ? `${sexOnFertileDays}/${fertileDays}` : "-";

    // Pregnancy possibility status (qualitative, grounded in necessary conditions)
    let pregnancyText = "Unknown";
    if (ovulationConfirmed) {
        pregnancyText = sexCount > 0 ? "Possible" : "No sex";
        
        // Pregnancy test reminder: if period is late and ovulation confirmed
        if (userGoal === 'conceive' && cycleStats.median) {
            const startDate = new Date(cycleStartKey);
            const expectedPeriod = new Date(startDate.getTime() + cycleStats.median * 24 * 60 * 60 * 1000);
            const daysLate = Math.floor((currentMs - expectedPeriod.getTime()) / (1000 * 60 * 60 * 24));
            if (daysLate >= 3) {
                sexRec = sexRec ? sexRec + " Take a pregnancy test." : "Take a pregnancy test.";
            }
        }
    }

    // Sex recommendation based on goal
    let sexRec = "";
    const isFertileWindow = isHighlyFertile || isPotentiallyFertile || statusText === "Potentially Fertile";
    const isLowFertility = statusText === "Low Fertility";

    if (userGoal === 'conceive') {
        if (isFertileWindow) {
            if (hadSexYesterday) {
                sexRec = "Rest today, had unprotected sex yesterday.";
            } else {
                sexRec = "Have unprotected sex today.";
            }
        } else if (isLowFertility) {
            sexRec = "Low chance of conception.";
        }
    } else {
        if (isFertileWindow) {
            sexRec = "Avoid unprotected sex today.";
        } else if (isLowFertility) {
            sexRec = "Safe to have unprotected sex.";
        }
    }

    setInsight(statusText, message, color, cycleDay, phase, sexRec, cycleStats, nextPeriodText, ovulationText, sexCount, pregnancyText, fertileSexText);
}

// 3-over-6 rule: 3 days of temps >= 0.2C above the highest of the previous 6 days, tolerant of missing days
function checkBBTShift(dates) {
    const recentDates = dates.slice(-14);
    const validTemps = recentDates.map(d => ({ date: d, temp: cycleData[d].bbt })).filter(item => item.temp !== null && !isNaN(item.temp));

    if (validTemps.length < 9) return false;

    // Look at the last 3 valid temps
    const last3 = validTemps.slice(-3);
    const prev6 = validTemps.slice(-9, -3);

    const highestPrev6 = Math.max(...prev6.map(item => item.temp));
    const threshold = highestPrev6 + 0.2;

    const isShiftConfirmed = last3.every(item => item.temp >= threshold);

    // Realism check: ensure shift is reasonable (e.g., max difference not > 2.0C to avoid garbage data)
    const lowestPrev6 = Math.min(...prev6.map(item => item.temp));
    const highestLast3 = Math.max(...last3.map(item => item.temp));
    if (highestLast3 - lowestPrev6 > 2.0) return false; // Likely invalid data (e.g. fever or typo)

    return isShiftConfirmed;
}

function setInsight(statusLabel, message, colorCode, dayLabel, phaseLabel, sexRec, cycleStats, nextPeriodText, ovulationText, sexCount, pregnancyText, fertileSexText) {
    fertilityStatus.textContent = statusLabel;
    fertilityIndicator.style.backgroundColor = colorCode;
    document.getElementById('insightCard').style.borderTopColor = colorCode;

    // Combine message with sex recommendation
    if (sexRec) {
        insightMessage.textContent = message + " " + sexRec;
    } else {
        insightMessage.textContent = message;
    }

    cycleDayDisplay.textContent = dayLabel;
    cyclePhaseDisplay.textContent = phaseLabel;
    avgCycleDisplay.textContent = cycleStats.median || "-";
    nextPeriodDisplay.textContent = nextPeriodText;
    ovulationDisplay.textContent = ovulationText;
    sexCountDisplay.textContent = sexCount;
    pregnancyDisplay.textContent = pregnancyText;
    fertileSexDisplay.textContent = fertileSexText;
}

// --- Data Export/Import ---
function exportData() {
    const exportObj = {
        cycleData: cycleData,
        goal: userGoal,
        pregnant: isPregnant
    };
    const dataStr = JSON.stringify(exportObj, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `cycletracker_backup_${getTodayKey()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}

function importData(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        try {
            const importedObj = JSON.parse(e.target.result);
            if (typeof importedObj !== 'object' || importedObj === null) {
                showToast('Invalid backup file format.');
                return;
            }

            // Detect format: new format has "cycleData" and "goal"; old format is cycleData directly
            let rawData = importedObj;
            if (importedObj.cycleData && typeof importedObj.cycleData === 'object') {
                rawData = importedObj.cycleData;
                // Restore goal setting if present
                if (importedObj.goal && ['avoid', 'conceive'].includes(importedObj.goal)) {
                    userGoal = importedObj.goal;
                    localStorage.setItem(GOAL_KEY, userGoal);
                    setButtonGroupValue(goalGroup, userGoal);
                }
                // Restore pregnant status if present
                if ('pregnant' in importedObj) {
                    isPregnant = importedObj.pregnant;
                    localStorage.setItem(PREGNANT_KEY, String(isPregnant));
                    setButtonGroupValue(pregnantGroup, String(isPregnant));
                }
            }

            // Migrate mucus values in imported data
            for (let key in rawData) {
                if (rawData[key].mucus) {
                    rawData[key].mucus = migrateMucusValue(rawData[key].mucus);
                }
            }

            cycleData = rawData;
            localStorage.setItem(STORAGE_KEY, JSON.stringify(cycleData));
            showToast('Data Imported Successfully!');
            handleDateChange();
        } catch (err) {
            showToast('Error reading backup file.');
        }
    };
    reader.readAsText(file);
    event.target.value = '';
}

// Boot up
init();
