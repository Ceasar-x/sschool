const Book = require("../models/Book.model");
const { sendEmail } = require("../services/nodemailer")


async function listBooks(req, res) {
  try {
    const { page = 1, limit = 10, search } = req.query;
    const query = {};

    // Search functionality
    if (search) {
      query.$or = [
        { bookName: { $regex: search, $options: 'i' } },
        { author: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    const books = await Book.find(query)
      .populate('userId', 'name email role')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Book.countDocuments(query);

    res.json({
      books,
      totalPages: Math.ceil(total / limit),
      currentPage: page,
      total
    });
  } catch (err) {
    console.error('List books error:', err);
    res.status(500).json({ error: "Server error while fetching books" });
  }
}

async function getBookById(req, res) {
  try {
    const book = await Book.findById(req.params.id)
      .populate('userId', 'name email role');
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }
    
    res.json(book);
  } catch (err) {
    console.error('Get book by ID error:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: "Invalid book ID" });
    }
    
    res.status(500).json({ error: "Server error while fetching book" });
  }
}

async function createBook(req, res) {
  try {
    const { bookName, author, description } = req.body;
    
    // Validation
    if (!bookName || !author) {
      return res.status(400).json({ error: "Book name and author are required" });
    }

    // Check if book already exists
    const existingBook = await Book.findOne({ 
      bookName: bookName.trim(), 
      author: author.trim() 
    });
    
    if (existingBook) {
      return res.status(409).json({ error: "Book with this name and author already exists" });
    }

    const book = await Book.create({
      userId: req.user?.id || null,
      bookName: bookName.trim(),
      author: author.trim(),
      description: description?.trim() || "",
    });

    const populatedBook = await Book.findById(book._id)
      .populate('userId', 'name email role');

    // Send notification email to admin
    const adminNotificationSubject = "SSchool - New Book Added";
    const adminNotificationMessage = `Dear ${req.user.name},

You have successfully added a new book to the library.

Book Details:
- Book Name: ${book.bookName}
- Author: ${book.author}
- Description: ${book.description || 'No description provided'}
- Added on: ${new Date(book.createdAt).toLocaleDateString()}

The book is now available for all users to view.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(req.user.email, adminNotificationSubject, adminNotificationMessage);

    res.status(201).json({ 
      message: "Book created successfully", 
      book: populatedBook 
    });
  } catch (err) {
    console.error('Create book error:', err);
    res.status(500).json({ error: "Server error while creating book" });
  }
}

async function updateBook(req, res) {
  try {
    const { bookName, author, description } = req.body;
    const updates = {};

    if (bookName) updates.bookName = bookName.trim();
    if (author) updates.author = author.trim();
    if (description !== undefined) updates.description = description.trim();

    const book = await Book.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    ).populate('userId', 'name email role');

    // Send notification email to admin
    const adminNotificationSubject = "SSchool - Book Updated";
    const adminNotificationMessage = `Dear ${req.user.name},

You have successfully updated a book in the library.

Updated Book Details:
- Book Name: ${book.bookName}
- Author: ${book.author}
- Description: ${book.description || 'No description provided'}
- Updated on: ${new Date(book.updatedAt).toLocaleDateString()}

If you have any questions about these changes, please contact support.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(req.user.email, adminNotificationSubject, adminNotificationMessage);

    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    res.json({ message: "Book updated successfully", book });
  } catch (err) {
    console.error('Update book error:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: "Invalid book ID" });
    }
    
    res.status(500).json({ error: "Server error while updating book" });
  }
}

async function deleteBook(req, res) {
  try {
    const book = await Book.findById(req.params.id);
    
    if (!book) {
      return res.status(404).json({ error: "Book not found" });
    }

    // Store book info before deletion
    const deletedBookInfo = {
      bookName: book.bookName,
      author: book.author,
      description: book.description
    };

    // Delete the book
    await Book.findByIdAndDelete(req.params.id);

    // Send notification email to admin
    const adminNotificationSubject = "SSchool - Book Deleted";
    const adminNotificationMessage = `Dear ${req.user.name},

You have successfully deleted a book from the library.

Deleted Book Details:
- Book Name: ${deletedBookInfo.bookName}
- Author: ${deletedBookInfo.author}
- Description: ${deletedBookInfo.description || 'No description was provided'}
- Deleted on: ${new Date().toLocaleDateString()}

The book is no longer available for users to view.

Best regards,
SSchool Team
Developer: kunlexlatest@gmail.com`;

    await sendEmail(req.user.email, adminNotificationSubject, adminNotificationMessage);
    
    res.json({ message: "Book deleted successfully" });
  } catch (err) {
    console.error('Delete book error:', err);
    
    if (err.kind === 'ObjectId') {
      return res.status(400).json({ error: "Invalid book ID" });
    }
    
    res.status(500).json({ error: "Server error while deleting book" });
  }
}


async function totalBooks(req, res) {
  try {
    const total = await Book.countDocuments();
    res.json({ total });
  } catch (err) {
    console.error('Total books error:', err);
    res.status(500).json({ error: "Server error while counting books" });
  }
}

module.exports = { 
  listBooks, 
  getBookById,
  createBook, 
  updateBook,
  deleteBook, 
  totalBooks 
};