// ============== CONFIGURATION ==============
const SPREADSHEET_ID = "1OWV3j54kW5SgH7MvzggiKsgzKbu10J-ZdL4lkOtMxC8"; // TODO: Leave empty to use the container-bound spreadsheet, or enter your Spreadsheet ID.

const SHEET_NAMES = {
  BOOKS: "Books",
  QUOTES: "Quotes",
  REVIEWS: "Reviews",
  GOALS: "Goals",
};

// Define canonical column headers for each sheet. The *order* is no longer critical for writing data,
// but the *names* must match your spreadsheet headers.
const COLUMNS = {
  BOOKS: ['id', 'createdAt', 'updatedAt', 'title', 'author', 'publisher', 'status', 'startedDate', 'completionDate', 'pages', 'currentPage', 'tags'],
  QUOTES: ['id', 'createdAt', 'bookId', 'bookTitle', 'bookAuthor', 'quoteText', 'pageNumber'],
  REVIEWS: ['id', 'createdAt', 'bookId', 'rating', 'shortReview', 'detailedReview'],
  GOALS: ['year_month', 'year', 'month', 'target'],
};
// ===========================================


// ============== MAIN HANDLER ==============
/**
 * Main entry point for all API requests.
 * Handles POST requests, parses the action and payload, and routes to the appropriate function.
 */
function doPost(e) {
  // When running the function from the Apps Script editor for testing, the event object 'e' will be undefined.
  // This block creates a mock event object to prevent a "Cannot read properties of undefined (reading 'postData')" error.
  // This allows for safe testing from the editor without affecting the live web app's functionality.
  if (e === undefined) {
    e = {
      postData: {
        contents: JSON.stringify({
          action: 'getBooks', // A safe, read-only default action for testing
          payload: {}
        })
      }
    };
    Logger.log('Running in test mode with default action "getBooks".');
  }

  try {
    const { action, payload } = JSON.parse(e.postData.contents);
    
    // Route the request to the correct handler function
    switch (action) {
      // Book actions
      case 'getBooks':
        return successResponse(getBooks(payload));
      case 'getBookById':
        return successResponse(getBookById(payload));
      case 'addBook':
        return successResponse(addBook(payload));
      case 'updateBook':
        return successResponse(updateBook(payload));
      case 'deleteBook':
        return successResponse(deleteBook(payload));
      
      // Quote actions
      case 'getQuotes':
        return successResponse(getQuotes());
      case 'getQuotesByBookId':
        return successResponse(getQuotesByBookId(payload));
      case 'addQuote':
        return successResponse(addQuote(payload));
      case 'updateQuote':
        return successResponse(updateQuote(payload));
      case 'deleteQuote':
        return successResponse(deleteQuote(payload));

      // Review actions
      case 'addBookReview':
        return successResponse(addBookReview(payload));
      
      // Goal actions
      case 'setReadingGoal':
        return successResponse(setReadingGoal(payload));
      case 'getReadingGoalProgress':
        return successResponse(getReadingGoalProgress(payload));
        
      // Stats actions
      case 'getCompletedBooksStats':
        return successResponse(getCompletedBooksStats());
      case 'getDetailedStats':
        return successResponse(getDetailedStats());

      default:
        return errorResponse(`Unknown action: ${action}`);
    }
  } catch (error) {
    Logger.log(`Error in doPost: ${error.message}\n${error.stack}`);
    return errorResponse(`An unexpected server error occurred: ${error.message}`, 500);
  }
}

// ============== API IMPLEMENTATIONS ==============

// --- Book Functions ---

function getBooks(payload = {}) {
    const data = sheetToJSON(getSheet(SHEET_NAMES.BOOKS));
    if (payload.statuses) {
        const statuses = payload.statuses.split(',');
        return data.filter(book => statuses.includes(book.status));
    }
    return data;
}

function getBookById(payload) {
    const books = sheetToJSON(getSheet(SHEET_NAMES.BOOKS));
    const book = books.find(b => b.id == payload.id);
    // Also fetch reviews for the book
    if (book) {
      const reviews = sheetToJSON(getSheet(SHEET_NAMES.REVIEWS));
      book.review = reviews.find(r => r.bookId == payload.id) || null;
    }
    return book;
}

function addBook(payload) {
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);

    try {
        const sheet = getSheet(SHEET_NAMES.BOOKS);
        const headers = getHeaders(sheet);
        const now = new Date();
        const newId = Utilities.getUuid();
        
        const rowDataObject = {
          id: newId,
          createdAt: now,
          updatedAt: now,
          title: payload.title,
          author: payload.author,
          publisher: payload.publisher,
          status: payload.status,
          startedDate: payload.startedDate,
          completionDate: payload.completionDate,
          pages: payload.pages,
          currentPage: payload.currentPage,
          tags: payload.tags,
        };

        const newRow = headers.map(header => {
          const value = rowDataObject[header];
          if (header === 'tags' && Array.isArray(value)) {
            return value.join(',');
          }
          return value !== undefined && value !== null ? value : ''; 
        });

        sheet.appendRow(newRow);
        return { id: newId, message: "Book added successfully." };
    } finally {
        lock.releaseLock();
    }
}

function updateBook(payload) {
    const { bookId, data } = payload;
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);

    try {
        const sheet = getSheet(SHEET_NAMES.BOOKS);
        const headers = getHeaders(sheet);
        const [rowIndex, rowData] = findRowById(sheet, bookId);
        
        if (rowIndex === -1) {
            throw new Error(`Book with ID ${bookId} not found.`);
        }

        const updatedRow = [...rowData]; // Create a mutable copy
        const updates = { ...data, updatedAt: new Date() };

        headers.forEach((header, index) => {
            if (updates.hasOwnProperty(header)) {
                let value = updates[header];
                if (header === 'tags' && Array.isArray(value)) {
                    updatedRow[index] = value.join(',');
                } else {
                    updatedRow[index] = (value !== undefined && value !== null) ? value : '';
                }
            }
        });
        
        sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
        return { id: bookId, message: "Book updated successfully." };
    } finally {
        lock.releaseLock();
    }
}

function deleteBook(payload) {
    const { bookId } = payload;
    const lock = LockService.getScriptLock();
    lock.waitLock(30000);

    try {
        // Delete from Books sheet
        deleteRow(SHEET_NAMES.BOOKS, bookId);

        // Delete associated quotes
        deleteRowsByColumnValue(getSheet(SHEET_NAMES.QUOTES), 'bookId', bookId);

        // Delete associated reviews
        deleteRowsByColumnValue(getSheet(SHEET_NAMES.REVIEWS), 'bookId', bookId);
        
        return { id: bookId, message: "Book and all associated data deleted successfully." };
    } finally {
        lock.releaseLock();
    }
}


// --- Quote Functions ---

function getQuotes() {
    const data = sheetToJSON(getSheet(SHEET_NAMES.QUOTES));
    return data.sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
}

function getQuotesByBookId(payload) {
    const data = sheetToJSON(getSheet(SHEET_NAMES.QUOTES));
    return data.filter(q => q.bookId == payload.bookId);
}

function addQuote(payload) {
    const sheet = getSheet(SHEET_NAMES.QUOTES);
    const headers = getHeaders(sheet);
    const newId = Utilities.getUuid();
    const now = new Date();
    
    const rowDataObject = {
        ...payload,
        id: newId,
        createdAt: now,
    };

    const newRow = headers.map(header => {
        const value = rowDataObject[header];
        return value !== undefined && value !== null ? value : '';
    });

    sheet.appendRow(newRow);
    return { id: newId, message: "Quote added successfully." };
}

function updateQuote(payload) {
    const { quoteId, data } = payload;
    return updateRow(SHEET_NAMES.QUOTES, quoteId, data);
}

function deleteQuote(payload) {
    const { quoteId } = payload;
    return deleteRow(SHEET_NAMES.QUOTES, quoteId);
}


// --- Review Functions ---

function addBookReview(payload) {
    const sheet = getSheet(SHEET_NAMES.REVIEWS);
    const headers = getHeaders(sheet);
    const newId = Utilities.getUuid();
    const now = new Date();
    
    const rowDataObject = {
      ...payload,
      id: newId,
      createdAt: now,
    };

    const newRow = headers.map(header => {
        const value = rowDataObject[header];
        return value !== undefined && value !== null ? value : '';
    });

    sheet.appendRow(newRow);
    return { id: newId, message: "Review added successfully." };
}


// --- Goal Functions ---

function setReadingGoal(payload) {
    const { year, month, target } = payload;
    const sheet = getSheet(SHEET_NAMES.GOALS);
    const headers = getHeaders(sheet);
    const yearMonthId = `${year}-${String(month).padStart(2, '0')}`;
    
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
        const idColumnIndex = headers.indexOf('year_month');
        if (idColumnIndex === -1) throw new Error("Sheet 'Goals' must have a 'year_month' column.");
        
        const [rowIndex] = findRowById(sheet, yearMonthId, idColumnIndex);
        
        const rowDataObject = {
          year_month: yearMonthId,
          year: year,
          month: month,
          target: target,
        };
        const newRow = headers.map(h => rowDataObject[h] !== undefined ? rowDataObject[h] : '');

        if (rowIndex > -1) {
            sheet.getRange(rowIndex, 1, 1, newRow.length).setValues([newRow]);
        } else {
            sheet.appendRow(newRow);
        }
        return { id: yearMonthId, message: "Goal set successfully." };
    } finally {
        lock.releaseLock();
    }
}

function getReadingGoalProgress(payload) {
    const { year, month } = payload;
    const yearMonthId = `${year}-${String(month).padStart(2, '0')}`;
    
    const goals = sheetToJSON(getSheet(SHEET_NAMES.GOALS));
    const goal = goals.find(g => g.year_month === yearMonthId);
    
    if (!goal || !goal.target) {
        return { target: 0, achieved: 0, progress: 0 };
    }

    const books = getBooks({ statuses: 'completed' });
    const achieved = books.filter(book => {
        if (!book.completionDate) return false;
        const completionDate = new Date(book.completionDate);
        return completionDate.getFullYear() === year && (completionDate.getMonth() + 1) === month;
    }).length;
    
    const progress = Math.round((achieved / goal.target) * 100);
    
    return { target: goal.target, achieved, progress: Math.min(progress, 100) };
}


// --- Stats Functions ---

function getCompletedBooksStats() {
    const books = getBooks({ statuses: 'completed' });
    const now = new Date();
    const thisYear = now.getFullYear();
    const thisMonth = now.getMonth();
    
    let thisYearBooks = 0;
    let thisMonthBooks = 0;
    let totalPages = 0;
    
    books.forEach(book => {
        totalPages += Number(book.pages) || 0;
        if (book.completionDate) {
            const completionDate = new Date(book.completionDate);
            if (completionDate.getFullYear() === thisYear) {
                thisYearBooks++;
                if (completionDate.getMonth() === thisMonth) {
                    thisMonthBooks++;
                }
            }
        }
    });
    
    return {
        completedBooks: books.length,
        thisYearBooks,
        thisMonthBooks,
        totalPages
    };
}

function getDetailedStats() {
    const books = getBooks({ statuses: 'completed' });
    const reviews = sheetToJSON(getSheet(SHEET_NAMES.REVIEWS));

    // 1. Monthly Data
    const monthlyData = {};
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);

    for (let i = 0; i < 12; i++) {
        const date = new Date(twelveMonthsAgo.getFullYear(), twelveMonthsAgo.getMonth() + i, 1);
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyData[monthKey] = { name: `${date.getMonth() + 1}월`, books: 0 };
    }

    books.forEach(book => {
        if (book.completionDate) {
            const d = new Date(book.completionDate);
            if (d >= twelveMonthsAgo) {
                const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
                if (monthlyData[monthKey]) {
                    monthlyData[monthKey].books++;
                }
            }
        }
    });

    // 2. Rating Data
    const ratingCounts = { '5': 0, '4': 0, '3': 0, '2': 0, '1': 0 };
    reviews.forEach(review => {
        if (review.rating && ratingCounts[review.rating] !== undefined) {
            ratingCounts[review.rating]++;
        }
    });
    const ratingData = Object.entries(ratingCounts)
        .map(([name, value]) => ({ name: `★${name}`, value }))
        .filter(item => item.value > 0);
        
    // 3. Tag Data
    const tagCounts = {};
    books.forEach(book => {
        if (book.tags) {
            const tags = String(book.tags).split(',').map(t => t.trim()).filter(Boolean);
            tags.forEach(tag => {
                tagCounts[tag] = (tagCounts[tag] || 0) + 1;
            });
        }
    });
    const tagData = Object.entries(tagCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a,b) => b.value - a.value);

    return {
        monthlyData: Object.values(monthlyData),
        ratingData,
        tagData
    };
}


// ============== UTILITY FUNCTIONS ==============

/**
 * Returns a Google Sheet object by name. This function has been redesigned to be more
 * resilient by prioritizing the most stable connection method.
 */
function getSheet(sheetName) {
  let ss = null;

  try {
    ss = SpreadsheetApp.getActiveSpreadsheet();
  } catch (e) {
    Logger.log("Could not get active spreadsheet, will try by ID. Error: " + e.message);
    ss = null;
  }
  
  if (!ss) {
    if (!SPREADSHEET_ID || SPREADSHEET_ID === "<YOUR_SPREADSHEET_ID>") {
      throw new Error(
        'CRITICAL CONFIGURATION ERROR: This script is not bound to a Google Sheet, and the SPREADSHEET_ID is not set in Code.js. ' +
        'Please open Code.js, find the SPREADSHEET_ID constant at the top, and replace the placeholder with the actual ID from your Google Sheet URL.'
      );
    }
    
    try {
      ss = SpreadsheetApp.openById(SPREADSHEET_ID);
    } catch (e) {
      Logger.log(`Error opening spreadsheet by ID: ${SPREADSHEET_ID}. Details: ${e.message}`);
      throw new Error(
        `CONFIGURATION ERROR: Could not open the spreadsheet with the specified ID ('${SPREADSHEET_ID}'). ` +
        'Please verify that the SPREADSHEET_ID in Code.js is correct and that you have granted the script permission to access this spreadsheet. ' +
        `Original error: ${e.message}`
      );
    }
  }

  if (!ss) {
    throw new Error("Fatal Error: Could not obtain a reference to the spreadsheet using any method.");
  }

  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    throw new Error(
      `CONFIGURATION ERROR: A sheet (tab) named "${sheetName}" was not found inside it. ` +
      'Please check the SHEET_NAMES configuration in Code.js and make sure it exactly matches the tab names in your Google Sheet. Check for extra spaces or case sensitivity.'
    );
  }

  return sheet;
}

// A simple cache for sheet headers to avoid repeated lookups.
const headerCache = {};
function getHeaders(sheet) {
  const sheetName = sheet.getName();
  if (headerCache[sheetName]) {
    return headerCache[sheetName];
  }
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  headerCache[sheetName] = headers;
  return headers;
}

/**
 * Converts a Google Sheet's data into an array of JSON objects.
 */
function sheetToJSON(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data.shift().map(String);
  return data.map(row => {
    const obj = {};
    headers.forEach((header, i) => {
      obj[header] = row[i] instanceof Date ? row[i].toISOString() : row[i];
    });
    return obj;
  });
}

/**
 * Finds a row by its ID and returns its 1-based index and data array.
 */
function findRowById(sheet, id, idColumnIndex = 0) {
  const data = sheet.getDataRange().getValues();
  for (let i = 1; i < data.length; i++) { // Start from 1 to skip header
    if (data[i][idColumnIndex] == id) {
      return [i + 1, data[i]]; // Return 1-based index and the row data
    }
  }
  return [-1, null];
}

/**
 * Generic function to update a row in any sheet.
 */
function updateRow(sheetName, id, dataToUpdate) {
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
        const sheet = getSheet(sheetName);
        const headers = getHeaders(sheet);
        const idColumnIndex = headers.indexOf('id');
        if (idColumnIndex === -1) throw new Error(`Sheet '${sheetName}' must have an 'id' column.`);

        const [rowIndex, rowData] = findRowById(sheet, id, idColumnIndex);

        if (rowIndex === -1) {
            throw new Error(`Item with ID ${id} not found in sheet ${sheetName}.`);
        }

        const updatedRow = [...rowData];
        
        headers.forEach((header, index) => {
            if (dataToUpdate.hasOwnProperty(header)) {
                updatedRow[index] = dataToUpdate[header];
            }
        });
        
        const updatedAtIndex = headers.indexOf('updatedAt');
        if (updatedAtIndex !== -1) {
          updatedRow[updatedAtIndex] = new Date();
        }
        
        sheet.getRange(rowIndex, 1, 1, updatedRow.length).setValues([updatedRow]);
        return { id: id, message: "Item updated successfully." };
    } finally {
        lock.releaseLock();
    }
}

/**
 * Generic function to delete a row from any sheet.
 */
function deleteRow(sheetName, id) {
    const lock = LockService.getScriptLock();
    lock.waitLock(15000);
    try {
        const sheet = getSheet(sheetName);
        const headers = getHeaders(sheet);
        const idColumnIndex = headers.indexOf('id');
        if (idColumnIndex === -1) throw new Error(`Sheet '${sheetName}' must have an 'id' column.`);
        
        const [rowIndex] = findRowById(sheet, id, idColumnIndex);
        
        if (rowIndex > -1) {
            sheet.deleteRow(rowIndex);
            return { id, message: "Item deleted successfully." };
        }
        return { id, message: "Item not found." };
    } finally {
        lock.releaseLock();
    }
}

/**
 * Deletes all rows where a specific column matches a given value.
 */
function deleteRowsByColumnValue(sheet, columnName, value) {
    const headers = getHeaders(sheet);
    const colIndex = headers.indexOf(columnName);
    if (colIndex === -1) return;

    const data = sheet.getDataRange().getValues();
    const rowsToDelete = [];
    data.forEach((row, i) => {
        if (i > 0 && row[colIndex] == value) { // i > 0 to skip header
            rowsToDelete.push(i + 1);
        }
    });

    for (let i = rowsToDelete.length - 1; i >= 0; i--) {
        sheet.deleteRow(rowsToDelete[i]);
    }
}

// ============== RESPONSE HELPERS ==============
/**
 * Creates a successful JSON response.
 */
function successResponse(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data }))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Creates an error JSON response.
 */
function errorResponse(error, statusCode = 400) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error }))
    .setMimeType(ContentService.MimeType.JSON);
}