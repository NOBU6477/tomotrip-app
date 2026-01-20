// Guide Registration API for TomoTrip
// Integrates SMS verification, file upload, and database storage
const { smsService } = require('./smsService');
const { adminAuthService } = require('./adminAuth');
const { guideDbService } = require('./guideDbService');
// Database storage - use PostgreSQL with JSON file fallback
const fs = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

class GuideAPIService {
  constructor() {
    this.fileStorage = null; // Will be injected by server initialization
    this.guidesFilePath = path.join(__dirname, '../data/guides.json');
    this.touristsFilePath = path.join(__dirname, '../data/tourists.json');
    this.pendingRegistrations = new Map(); // Temporary storage for incomplete registrations
    this.dbService = guideDbService; // PostgreSQL database service
    this.ensureDataDirectory();
    this.ensureTouristsFile();
  }

  // Ensure data directory exists
  ensureDataDirectory() {
    const dataDir = path.join(__dirname, '../data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    if (!fs.existsSync(this.guidesFilePath)) {
      fs.writeFileSync(this.guidesFilePath, JSON.stringify([], null, 2));
    }
  }

  // Ensure tourists file exists
  ensureTouristsFile() {
    if (!fs.existsSync(this.touristsFilePath)) {
      fs.writeFileSync(this.touristsFilePath, JSON.stringify([], null, 2));
    }
  }

  // Load guides from database (with file fallback only on DB error)
  // Empty DB result is authoritative (returns empty array, not JSON fallback)
  async loadGuidesFromDb() {
    const dbGuides = await this.dbService.loadAllGuides();
    
    if (dbGuides !== null) {
      // DB query succeeded - use result even if empty
      console.log(`📊 [DB] Using PostgreSQL: ${dbGuides.length} guides`);
      return dbGuides;
    }
    
    // DB returned null (error or no pool) - fallback to JSON for reads
    console.warn('⚠️ [DB] Database unavailable, using file fallback');
    return this.loadGuidesFromFile();
  }

  // Load guides from file (fallback)
  loadGuidesFromFile() {
    try {
      const data = fs.readFileSync(this.guidesFilePath, 'utf8');
      const guides = JSON.parse(data);
      console.log(`📋 [FILE] Using JSON fallback: ${guides.length} guides`);
      return guides;
    } catch (error) {
      console.error('Error loading guides from file:', error);
      return [];
    }
  }

  // Sync load for backward compatibility
  loadGuides() {
    try {
      const data = fs.readFileSync(this.guidesFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading guides:', error);
      return [];
    }
  }

  // Save guides to file
  saveGuides(guides) {
    try {
      fs.writeFileSync(this.guidesFilePath, JSON.stringify(guides, null, 2));
    } catch (error) {
      console.error('Error saving guides:', error);
    }
  }

  // Load tourists from file
  loadTourists() {
    try {
      const data = fs.readFileSync(this.touristsFilePath, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Error loading tourists:', error);
      return [];
    }
  }

  // Save tourists to file
  saveTourists(tourists) {
    try {
      fs.writeFileSync(this.touristsFilePath, JSON.stringify(tourists, null, 2));
    } catch (error) {
      console.error('Error saving tourists:', error);
    }
  }

  // Add guide to storage (PostgreSQL + JSON backup)
  // DB is mandatory - throws on failure
  async addGuideToDb(guide) {
    // DB write is mandatory for consistency
    await this.dbService.addGuide(guide);
    console.log(`✅ [DB] Guide saved to PostgreSQL: ${guide.guideName}`);
    
    // Also save to JSON as backup (only after successful DB write)
    try {
      const guides = this.loadGuides();
      guides.push(guide);
      this.saveGuides(guides);
      console.log(`💾 [FILE] Guide saved to JSON backup: ${guide.guideName}`);
    } catch (fileError) {
      console.warn('⚠️ [FILE] JSON backup failed (non-fatal):', fileError.message);
    }
  }

  // Sync add guide - DEPRECATED: Use registerGuide for new registrations
  // DB is mandatory - throws on failure
  async addGuide(guide) {
    // DB write is mandatory for consistency
    await this.dbService.addGuide(guide);
    console.log(`✅ [DB] Guide added via legacy method: ${guide.guideName || guide.name}`);
    
    // Also save to JSON backup (after successful DB write)
    try {
      const guides = this.loadGuides();
      guides.push(guide);
      this.saveGuides(guides);
      console.log(`💾 [FILE] JSON backup saved: ${guide.guideName || guide.name}`);
    } catch (fileError) {
      console.warn('⚠️ [FILE] JSON backup failed (non-fatal):', fileError.message);
    }
  }

  // Normalize phone number to international format
  normalizePhoneNumber(phoneNumber) {
    // Remove all non-digit characters except +
    let normalizedPhone = phoneNumber.replace(/[-\s]/g, '');
    
    // Handle Japanese domestic format (starting with 0)
    if (normalizedPhone.match(/^0[789]0\d{8}$/)) {
      // Convert 090xxxxxxxx to +8190xxxxxxxx
      normalizedPhone = '+81' + normalizedPhone.substring(1);
    }
    
    return normalizedPhone;
  }

  // Update guide in storage - DB mandatory, JSON backup only after successful DB write
  // null = DB error, undefined = not found, object = success
  async updateGuideInStorage(guideId, updates) {
    // Try DB first (MANDATORY - no JSON fallback for writes)
    const dbResult = await this.dbService.updateGuide(guideId, updates);
    
    if (dbResult === null) {
      // DB returned null (error or no pool) - fail the update
      console.error('❌ [DB] updateGuide returned null - DB unavailable, update failed');
      return null; // Return null to signal failure
    }
    
    if (dbResult === undefined) {
      // Guide not found in DB
      console.warn('⚠️ [DB] Guide not found in DB:', guideId);
      return undefined;
    }
    
    // DB update succeeded - also update JSON backup
    console.log(`✅ [DB] Guide updated in PostgreSQL: ${guideId}`);
    try {
      const guides = this.loadGuides();
      const index = guides.findIndex(g => g.id === guideId);
      if (index !== -1) {
        guides[index] = { ...guides[index], ...updates, updatedAt: new Date().toISOString() };
        this.saveGuides(guides);
        console.log(`💾 [FILE] JSON backup updated: ${guideId}`);
      }
    } catch (fileError) {
      console.warn('⚠️ [FILE] JSON backup update failed (non-fatal):', fileError.message);
    }
    
    return dbResult;
  }

  // Get guide by ID from storage - DB first with JSON fallback
  // Returns: guide object, undefined (not found), or null (DB error)
  async getGuideFromStorage(guideId) {
    // Try DB first
    const dbResult = await this.dbService.getGuideById(guideId);
    
    if (dbResult !== null) {
      // DB query succeeded (dbResult is guide object or undefined for "not found")
      return dbResult;
    }
    
    // DB returned null (error or no pool) - fallback to JSON
    console.warn('⚠️ [DB] getGuideById returned null, using JSON fallback');
    const guides = this.loadGuides();
    return guides.find(g => g.id === guideId);
  }

  // Initialize API routes
  setupRoutes(app, upload) {
    // TEST ENDPOINT - NO MULTER
    app.post('/api/guides/test-upload', (req, res) => {
      console.log('🧪 TEST ENDPOINT CALLED - NO MULTER');
      console.log('  - Body:', req.body);
      res.json({ success: true, message: 'Test endpoint reached' });
    });
    
    // SMS verification endpoints - shared for guides and tourists
    app.post('/api/guides/send-verification', this.sendPhoneVerification.bind(this));
    app.post('/api/guides/verify-phone', this.verifyPhone.bind(this));
    
    // Tourist SMS verification endpoints (same as guides but with different context)
    app.post('/api/tourists/send-verification', this.sendPhoneVerification.bind(this));
    app.post('/api/tourists/verify-phone', this.verifyTouristPhone.bind(this));
    app.post('/api/tourists/register', this.registerTourist.bind(this));
    app.post('/api/tourists/login', this.touristLogin.bind(this));
    
    // File upload endpoints for guides
    app.post('/api/guides/upload-document', upload.array('documents', 3), this.uploadDocuments.bind(this));
    app.post('/api/guides/upload-profile-photo', upload.single('profilePhoto'), this.uploadProfilePhoto.bind(this));
    
    // File upload endpoints for tourists
    app.post('/api/tourists/upload-document', upload.single('document'), this.uploadTouristDocument.bind(this));
    
    // Image serving endpoint
    app.get('/objects/*', this.serveUploadedImage.bind(this));
    
    // Guide registration and authentication endpoints
    app.post('/api/guides/register', this.registerGuide.bind(this));
    app.post('/api/guides/login', this.guideLogin.bind(this));
    app.get('/api/guides', this.getGuides.bind(this));
    
    // Real-time email validation endpoint
    app.get('/api/guides/check-email', this.checkEmailAvailability.bind(this));
    
    // Guide editing endpoints
    app.get('/api/guides/:id', this.getGuideById.bind(this));
    app.put('/api/guides/:id/edit', this.updateGuide.bind(this));
    
    // Admin endpoints
    app.get('/api/admin/guides', adminAuthService.requireAuth('support'), this.getGuidesAdmin.bind(this));
    app.put('/api/admin/guides/:id/approve', adminAuthService.requireAuth('operator'), this.approveGuide.bind(this));
    app.put('/api/admin/guides/:id/reject', adminAuthService.requireAuth('operator'), this.rejectGuide.bind(this));
    
    console.log('✅ Guide API routes initialized');
  }

  // Send SMS verification code
  async sendPhoneVerification(req, res) {
    try {
      const { phoneNumber } = req.body;
      
      if (!phoneNumber) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_PHONE',
          message: '電話番号が必要です'
        });
      }

      // Normalize and validate phone number
      let normalizedPhone = phoneNumber.replace(/[-\s]/g, '');
      
      // Convert Japanese domestic format to international format
      if (normalizedPhone.match(/^0[789]0\d{8}$/)) {
        normalizedPhone = '+81' + normalizedPhone.substring(1);
      }
      
      // Validate normalized phone number format
      const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
      if (!phoneRegex.test(normalizedPhone)) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_PHONE',
          message: '有効な電話番号を入力してください（例: 090-1234-5678）'
        });
      }

      const result = await smsService.sendVerificationCode(normalizedPhone);
      
      if (result.success) {
        res.json({
          success: true,
          message: result.message,
          sid: result.sid,
          ...(result.code && { simulationCode: result.code }) // Only in simulation mode
        });
      } else {
        res.status(500).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ Phone verification error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'SMS送信中にエラーが発生しました'
      });
    }
  }

  // Verify submitted phone code
  async verifyPhone(req, res) {
    try {
      const { phoneNumber, code } = req.body;
      
      if (!phoneNumber || !code) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_DATA',
          message: '電話番号と認証コードが必要です'
        });
      }

      const result = smsService.verifyCode(phoneNumber, code);
      
      if (result.success) {
        // Create or update pending registration
        const sessionId = randomUUID();
        this.pendingRegistrations.set(sessionId, {
          phoneNumber,
          phoneVerified: true,
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        });

        res.json({
          success: true,
          message: result.message,
          sessionId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ Phone code verification error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '認証コード確認中にエラーが発生しました'
      });
    }
  }

  // Upload document images (ID, license, etc.)
  async uploadDocuments(req, res) {
    try {
      const { sessionId, documentType } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SESSION',
          message: 'セッションIDが必要です'
        });
      }

      const session = this.pendingRegistrations.get(sessionId);
      if (!session) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_SESSION',
          message: '無効なセッションです'
        });
      }

      if (!req.files || req.files.length === 0) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILES',
          message: 'ファイルがアップロードされていません'
        });
      }

      const uploadedFiles = [];
      
      for (const file of req.files) {
        try {
          // Upload file buffer to filesystem storage
          const uploadResult = await this.fileStorage.uploadFileBuffer(
            file.buffer,
            'documents',
            file.originalname
          );
          
          uploadedFiles.push({
            fileId: uploadResult.fileId,
            fileName: uploadResult.fileName,
            originalName: file.originalname,
            mimeType: file.mimetype,
            size: file.size,
            documentUrl: `/${uploadResult.relativePath}`
          });
        } catch (uploadError) {
          console.error(`❌ Failed to upload document: ${file.originalname}`, uploadError);
          throw new Error(`Failed to upload document: ${file.originalname}`);
        }
      }

      // Update session with document info
      session.documents = session.documents || [];
      session.documents.push(...uploadedFiles);
      this.pendingRegistrations.set(sessionId, session);

      res.json({
        success: true,
        message: 'ドキュメントのアップロード準備が完了しました',
        files: uploadedFiles
      });

    } catch (error) {
      console.error('❌ Document upload error:', error);
      res.status(500).json({
        success: false,
        error: 'UPLOAD_ERROR',
        message: 'ファイルアップロード中にエラーが発生しました'
      });
    }
  }

  // Upload profile photo
  async uploadProfilePhoto(req, res) {
    console.log('🚨 uploadProfilePhoto ENTRY 🚨', {
      body: req.body,
      hasFile: !!req.file,
      file: req.file ? {
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      hasFileStorage: !!this.fileStorage
    });
    
    // Defensive check for fileStorage
    if (!this.fileStorage) {
      console.error('❌ CRITICAL: fileStorage not initialized!');
      return res.status(500).json({
        success: false,
        error: 'STORAGE_NOT_INITIALIZED',
        message: 'ファイルストレージが初期化されていません'
      });
    }
    
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        console.error('❌ Missing sessionId');
        return res.status(400).json({
          success: false,
          error: 'MISSING_SESSION',
          message: 'セッションIDが必要です'
        });
      }

      const session = this.pendingRegistrations.get(sessionId);
      if (!session) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_SESSION',
          message: '無効なセッションです'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILE',
          message: 'プロフィール写真がアップロードされていません'
        });
      }

      try {
        // Upload file buffer to file storage
        const uploadResult = await this.fileStorage.uploadFileBuffer(
          req.file.buffer,
          'profiles',
          req.file.originalname
        );

        // Construct public URL for the uploaded file
        const profileImageUrl = uploadResult.publicUrl;

        // Update session with profile photo info
        session.profilePhoto = {
          fileId: uploadResult.fileId,
          fileName: uploadResult.fileName,
          originalName: req.file.originalname,
          mimeType: req.file.mimetype,
          size: req.file.size,
          profileImageUrl // Store the actual URL
        };
        this.pendingRegistrations.set(sessionId, session);

        console.log(`✅ Profile photo uploaded successfully: ${profileImageUrl}`);

        res.json({
          success: true,
          message: 'プロフィール写真のアップロードが完了しました',
          file: session.profilePhoto,
          profileImageUrl
        });

      } catch (uploadError) {
        console.error('❌ File storage upload error:', uploadError);
        throw new Error('Failed to upload file to storage');
      }

    } catch (err) {
      console.error('Error in uploadProfilePhoto:', err);
      console.error('Error stack:', err.stack);
      res.status(500).json({
        success: false,
        error: 'UPLOAD_ERROR',
        message: 'プロフィール写真アップロード中にエラーが発生しました',
        details: err.message
      });
    }
  }

  // Guide login authentication
  async guideLogin(req, res) {
    try {
      const { identifier, phone } = req.body;
      
      if (!identifier || !phone) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'ガイドIDまたはメールアドレスと電話番号が必要です'
        });
      }
      
      // Normalize phone number for comparison
      const normalizedPhone = this.normalizePhoneNumber(phone);
      console.log(`🔐 Guide login attempt - identifier: ${identifier}, phone: ${phone}, normalized: ${normalizedPhone}`);
      
      // Load all guides - DB first with JSON fallback
      let guides = [];
      try {
        const dbGuides = await this.dbService.loadAllGuides();
        if (dbGuides !== null) {
          guides = dbGuides;
          console.log(`🔐 [DB] Login using ${guides.length} guides from PostgreSQL`);
        } else {
          guides = this.loadGuides();
          console.log(`🔐 [FILE] Login using ${guides.length} guides from JSON fallback`);
        }
      } catch (dbError) {
        console.warn('⚠️ [DB] Login DB access failed, using JSON fallback:', dbError.message);
        guides = this.loadGuides();
      }
      
      // Find guide by identifier (ID, email, or name) and phone
      const guide = guides.find(g => {
        const matchesIdentifier = (
          g.id === identifier || 
          g.email === identifier || 
          g.guideEmail === identifier ||
          g.name === identifier ||
          g.guideName === identifier
        );
        
        // Normalize stored phone number for comparison
        const storedPhone = g.phoneNumber || g.phone;
        const normalizedStoredPhone = storedPhone ? this.normalizePhoneNumber(storedPhone) : null;
        
        const matchesPhone = (
          normalizedStoredPhone === normalizedPhone ||
          storedPhone === phone
        );
        
        if (matchesIdentifier) {
          console.log(`🔍 Found matching identifier - stored: ${storedPhone}, normalized: ${normalizedStoredPhone}, input: ${normalizedPhone}, matches: ${matchesPhone}`);
        }
        
        return matchesIdentifier && matchesPhone;
      });
      
      if (!guide) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'ガイドIDまたは電話番号が正しくありません'
        });
      }
      
      // Return sanitized guide data for login
      const loginGuideData = {
        id: guide.id,
        name: guide.name || guide.guideName,
        email: guide.email || guide.guideEmail,
        location: guide.location,
        introduction: guide.introduction || guide.guideIntroduction,
        experience: guide.experience || guide.guideExperience,
        sessionRate: guide.sessionRate || guide.guideSessionRate,
        status: guide.status,
        registeredAt: guide.registeredAt
      };
      
      console.log(`✅ Guide login successful: ${loginGuideData.name} (${guide.id})`);
      
      res.json({
        success: true,
        message: 'ログインに成功しました',
        guide: loginGuideData
      });
      
    } catch (error) {
      console.error('❌ Guide login error:', error);
      res.status(500).json({
        success: false,
        error: 'LOGIN_ERROR',
        message: 'ログイン中にエラーが発生しました'
      });
    }
  }

  // Tourist login authentication (email + phone number)
  async touristLogin(req, res) {
    try {
      const { email, phone } = req.body;
      
      if (!email || !phone) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_CREDENTIALS',
          message: 'メールアドレスと電話番号が必要です'
        });
      }
      
      // Normalize phone number
      const normalizedPhone = this.normalizePhoneNumber(phone);
      console.log(`🔐 Tourist login attempt - email: ${email}, phone: ${phone}, normalized: ${normalizedPhone}`);
      
      // Load all tourists from storage
      const tourists = this.loadTourists();
      
      // Find tourist by email and phone
      const tourist = tourists.find(t => {
        const matchesEmail = t.email && t.email.toLowerCase() === email.toLowerCase();
        
        // Normalize stored phone number for comparison
        const storedPhone = t.phoneNumber || t.phone;
        const normalizedStoredPhone = storedPhone ? this.normalizePhoneNumber(storedPhone) : null;
        
        const matchesPhone = (
          normalizedStoredPhone === normalizedPhone ||
          storedPhone === phone
        );
        
        if (matchesEmail) {
          console.log(`🔍 Found matching email - stored: ${storedPhone}, normalized: ${normalizedStoredPhone}, input: ${normalizedPhone}, matches: ${matchesPhone}`);
        }
        
        return matchesEmail && matchesPhone;
      });
      
      if (!tourist) {
        return res.status(401).json({
          success: false,
          error: 'INVALID_CREDENTIALS',
          message: 'メールアドレスまたは電話番号が正しくありません'
        });
      }
      
      // Return tourist data for login
      const loginTouristData = {
        id: tourist.id,
        firstName: tourist.firstName,
        lastName: tourist.lastName,
        email: tourist.email,
        nationality: tourist.nationality,
        phoneNumber: tourist.phoneNumber,
        status: tourist.status,
        registeredAt: tourist.registeredAt
      };
      
      console.log(`✅ Tourist login successful: ${tourist.firstName} ${tourist.lastName} (${tourist.id})`);
      
      res.json({
        success: true,
        message: 'ログインに成功しました',
        tourist: loginTouristData
      });
      
    } catch (error) {
      console.error('❌ Tourist login error:', error);
      res.status(500).json({
        success: false,
        error: 'LOGIN_ERROR',
        message: 'ログイン中にエラーが発生しました'
      });
    }
  }

  // Serve uploaded images (profile photos, documents, etc.)
  // NOTE: With filesystem storage, files are served directly by Express static middleware
  // This method is kept for backward compatibility but may not be needed
  async serveUploadedImage(req, res) {
    try {
      const objectPath = req.path;
      
      console.log(`🖼️ Image request for: ${objectPath}`);
      
      // Files are now served from public/uploads/ by Express static middleware
      // This is handled automatically by app.use('/uploads', express.static('public/uploads'))
      // If we reach here, the file doesn't exist
      res.status(404).json({
        success: false,
        error: 'IMAGE_NOT_FOUND',
        message: '画像が見つかりません'
      });
      
    } catch (error) {
      console.error('❌ Error serving image:', error);
      res.status(500).json({
        success: false,
        error: 'IMAGE_SERVE_ERROR',
        message: '画像の読み込み中にエラーが発生しました'
      });
    }
  }

  // Generate profile photo URL from profilePhoto object
  generateProfilePhotoUrl(profilePhoto) {
    if (!profilePhoto) {
      return null;
    }
    
    // Prefer new profileImageUrl field (full path)
    if (profilePhoto.profileImageUrl) {
      return profilePhoto.profileImageUrl;
    }
    
    // Fallback to fileName for compatibility
    if (profilePhoto.fileName) {
      return `/objects/uploads/profiles/${profilePhoto.fileName}`;
    }
    
    // Legacy fallback for old fileId-only records
    if (profilePhoto.fileId) {
      return `/objects/uploads/${profilePhoto.fileId}`;
    }
    
    return null;
  }

  // Complete guide registration
  async registerGuide(req, res) {
    try {
      const { sessionId, guideData } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SESSION',
          message: 'セッションIDが必要です'
        });
      }

      const session = this.pendingRegistrations.get(sessionId);
      if (!session || !session.phoneVerified) {
        return res.status(400).json({
          success: false,
          error: 'INVALID_SESSION',
          message: '電話認証が完了していません'
        });
      }

      // Validate required fields
      const requiredFields = ['guideName', 'guideEmail', 'guideGender', 'guideAge', 'guideExperience', 'guideLanguages', 'guideIntroduction', 'guideSpecialties', 'guideSessionRate', 'guideAvailability'];
      
      for (const field of requiredFields) {
        if (!guideData[field]) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_REQUIRED_FIELD',
            message: `必須フィールドが不足しています: ${field}`
          });
        }
      }

      // Normalize email address (trim whitespace)
      guideData.guideEmail = guideData.guideEmail.trim();
      const normalizedEmail = guideData.guideEmail.toLowerCase();
      
      // Check for duplicate email - PostgreSQL is authoritative
      // undefined = not found, object = found, exception = DB error
      let emailExists = false;
      
      try {
        const dbGuide = await this.dbService.getGuideByEmail(normalizedEmail);
        // undefined means not found in DB (email available)
        // object means found in DB (email taken)
        emailExists = (dbGuide !== undefined);
        console.log(`🔍 [DB] Email check: ${normalizedEmail} -> ${emailExists ? 'EXISTS' : 'AVAILABLE'}`);
      } catch (dbError) {
        // DB error - fail the request (don't fall back to JSON for registration)
        console.error('❌ [DB] Email check failed:', dbError.message);
        return res.status(503).json({
          success: false,
          error: 'DATABASE_UNAVAILABLE',
          message: 'データベースに接続できません。しばらくしてから再度お試しください。'
        });
      }
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          error: 'DUPLICATE_EMAIL',
          message: 'このメールアドレスは既に登録されています。別のメールアドレスをご使用ください。'
        });
      }

      // Create guide record
      const guideId = randomUUID();
      const guide = {
        id: guideId,
        ...guideData,
        phoneNumber: session.phoneNumber,
        phoneVerified: true,
        documents: session.documents || [],
        profilePhoto: session.profilePhoto,
        profileImageUrl: session.profilePhoto?.profileImageUrl || null, // Save profile image URL for easy access
        status: 'approved', // Auto-approve for development/demo
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Save to PostgreSQL (mandatory - DB is authoritative)
      // addGuide throws on error, so we catch and return 503
      try {
        await this.dbService.addGuide(guide);
        console.log(`✅ [DB] Guide saved to PostgreSQL: ${guide.guideName}`);
      } catch (dbError) {
        console.error('❌ [DB] PostgreSQL save failed:', dbError.message);
        return res.status(503).json({
          success: false,
          error: 'DATABASE_ERROR',
          message: 'データベースへの保存に失敗しました。しばらくしてから再度お試しください。'
        });
      }
      
      // Also save to JSON as backup (after successful DB write)
      try {
        const guides = this.loadGuides();
        guides.push(guide);
        this.saveGuides(guides);
        console.log(`💾 [FILE] Guide saved to JSON backup: ${guide.guideName}`);
      } catch (fileError) {
        // JSON backup failure is non-fatal (DB is authoritative)
        console.warn('⚠️ [FILE] JSON backup failed (non-fatal):', fileError.message);
      }

      // Clean up session
      this.pendingRegistrations.delete(sessionId);

      console.log(`✅ New guide registered: ${guide.guideName} (${guideId})`);

      res.json({
        success: true,
        message: 'ガイド登録が完了しました。審査後にメールでご連絡いたします。',
        guideId,
        guide: {
          id: guide.id,
          name: guide.guideName,
          email: guide.guideEmail,
          status: guide.status,
          registeredAt: guide.registeredAt
        }
      });

    } catch (error) {
      console.error('❌ Guide registration error:', error);
      res.status(500).json({
        success: false,
        error: 'REGISTRATION_ERROR',
        message: 'ガイド登録中にエラーが発生しました'
      });
    }
  }

  // Tourist phone verification (simpler version)
  async verifyTouristPhone(req, res) {
    try {
      const { phoneNumber, code } = req.body;
      
      if (!phoneNumber || !code) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_DATA',
          message: '電話番号と認証コードが必要です'
        });
      }

      // Normalize phone number (same as sendPhoneVerification)
      const normalizedPhone = this.normalizePhoneNumber(phoneNumber);
      
      const result = smsService.verifyCode(normalizedPhone, code);
      
      if (result.success) {
        // Store tourist verification session
        const sessionId = randomUUID();
        this.pendingRegistrations.set(sessionId, {
          phoneNumber: normalizedPhone, // Store normalized number
          phoneVerified: true,
          type: 'tourist',
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 30 * 60 * 1000).toISOString() // 30 minutes
        });

        res.json({
          success: true,
          message: result.message,
          sessionId
        });
      } else {
        res.status(400).json({
          success: false,
          error: result.error,
          message: result.message
        });
      }
    } catch (error) {
      console.error('❌ Tourist phone verification error:', error);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: '認証コード確認中にエラーが発生しました'
      });
    }
  }

  // Tourist registration
  async registerTourist(req, res) {
    try {
      const { sessionId, touristData } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SESSION',
          message: 'セッションIDが必要です'
        });
      }

      const session = this.pendingRegistrations.get(sessionId);
      if (!session || !session.phoneVerified || session.type !== 'tourist') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_SESSION',
          message: '電話認証が完了していません'
        });
      }

      // Validate required fields for tourists
      const requiredFields = ['firstName', 'lastName', 'email', 'nationality'];
      
      for (const field of requiredFields) {
        if (!touristData[field]) {
          return res.status(400).json({
            success: false,
            error: 'MISSING_REQUIRED_FIELD',
            message: `必須フィールドが不足しています: ${field}`
          });
        }
      }

      // Create tourist record
      const touristId = randomUUID();
      const tourist = {
        id: touristId,
        ...touristData,
        phoneNumber: session.phoneNumber,
        phoneVerified: true,
        status: 'active',
        registeredAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // Store tourist data in file storage for persistence
      const tourists = this.loadTourists();
      tourists.push(tourist);
      this.saveTourists(tourists);
      
      console.log(`✅ New tourist registered: ${tourist.firstName} ${tourist.lastName} (${touristId})`);

      // Clean up session
      this.pendingRegistrations.delete(sessionId);

      res.json({
        success: true,
        message: '観光客登録が完了しました。ようこそTomoTripへ！',
        touristId,
        tourist: {
          id: tourist.id,
          name: `${tourist.firstName} ${tourist.lastName}`,
          email: tourist.email,
          status: tourist.status,
          registeredAt: tourist.registeredAt
        }
      });

    } catch (error) {
      console.error('❌ Tourist registration error:', error);
      res.status(500).json({
        success: false,
        error: 'REGISTRATION_ERROR',
        message: '観光客登録中にエラーが発生しました'
      });
    }
  }

  // Upload tourist document
  async uploadTouristDocument(req, res) {
    try {
      const { sessionId, documentType } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({
          success: false,
          error: 'MISSING_SESSION',
          message: 'セッションIDが必要です'
        });
      }

      const session = this.pendingRegistrations.get(sessionId);
      if (!session || session.type !== 'tourist') {
        return res.status(400).json({
          success: false,
          error: 'INVALID_SESSION',
          message: '無効なセッションです'
        });
      }

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'NO_FILE',
          message: 'ファイルがアップロードされていません'
        });
      }

      const file = req.file;
      const fileData = {
        fileName: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        uploadedAt: new Date().toISOString(),
        documentType: documentType || 'identity'
      };

      // Add document to session
      if (!session.documents) {
        session.documents = [];
      }
      session.documents.push(fileData);
      
      console.log(`✅ Tourist document uploaded: ${file.originalname} for session ${sessionId}`);

      res.json({
        success: true,
        message: 'ドキュメントのアップロードが完了しました',
        document: fileData
      });

    } catch (error) {
      console.error('❌ Tourist document upload error:', error);
      res.status(500).json({
        success: false,
        error: 'UPLOAD_ERROR',
        message: 'ファイルアップロード中にエラーが発生しました'
      });
    }
  }

  // Get public guide list (approved guides only)
  async getGuides(req, res) {
    try {
      // Get language filter from query params (for language-specific page filtering)
      const { lang } = req.query;
      const requestedLang = (lang === 'en') ? 'en' : 'ja'; // Default to Japanese
      
      // Determine data source and environment
      const isProduction = process.env.NODE_ENV === 'production' || 
                          process.env.REPL_SLUG !== undefined;
      const envName = isProduction ? 'production' : 'development';
      
      // PostgreSQL is authoritative - try DB first, only fallback to JSON on failure
      let allGuides = [];
      let dataSource = 'unknown';
      
      // Always try DB if pool exists (connection may be lazy-initialized)
      try {
        const dbGuides = await this.dbService.loadApprovedGuides();
        if (dbGuides !== null) {
          // DB query succeeded - use DB result (even if empty)
          allGuides = dbGuides;
          dataSource = 'PostgreSQL';
          console.log(`📊 [DB] Loaded ${allGuides.length} approved guides from PostgreSQL`);
        } else {
          // DB returned null (connection failed) - fallback to JSON
          console.warn('⚠️ [DB] Query returned null, using JSON fallback');
          allGuides = this.loadGuides();
          dataSource = 'JSON-file-db-null';
        }
      } catch (dbError) {
        console.error('❌ [DB] Query exception:', dbError.message);
        // DB query threw exception - fallback to JSON
        allGuides = this.loadGuides();
        dataSource = 'JSON-file-error-fallback';
      }
      
      const approvedGuides = allGuides
        .filter(guide => guide.status === 'approved')
        .map(guide => ({
          id: guide.id,
          name: guide.guideName,
          guideName: guide.guideName, // Keep for compatibility
          email: guide.guideEmail,
          location: guide.location || guide.prefecture || '東京都 東京',
          languages: Array.isArray(guide.guideLanguages) ? guide.guideLanguages : [guide.guideLanguages],
          specialties: guide.guideSpecialties,
          experience: guide.guideExperience,
          sessionRate: guide.guideSessionRate,
          availability: guide.guideAvailability,
          registrationLanguage: guide.registrationLanguage || 'ja', // Include in response
          // Use profileImageUrl if available, fallback to generated URL
          profileImageUrl: guide.profileImageUrl || this.generateProfilePhotoUrl(guide.profilePhoto),
          profilePhoto: this.generateProfilePhotoUrl(guide.profilePhoto), // Keep for backward compatibility
          introduction: guide.guideIntroduction,
          averageRating: 4.8,
          status: guide.status,
          registeredAt: guide.registeredAt,
          // Extension policy fields
          extensionPolicy: guide.extensionPolicy || 'ask',
          lateNightPolicy: guide.lateNightPolicy || 'no'
        }))
        .sort((a, b) => new Date(b.registeredAt) - new Date(a.registeredAt)); // Newest first

      console.log(`📋 [${envName}] API returning ${approvedGuides.length} guides | source: ${dataSource} | lang: ${requestedLang}`);

      res.json({
        success: true,
        guides: approvedGuides,
        total: approvedGuides.length,
        _meta: {
          source: dataSource,
          environment: envName,
          timestamp: new Date().toISOString()
        }
      });
    } catch (error) {
      console.error('❌ Get guides error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'ガイド情報の取得中にエラーが発生しました'
      });
    }
  }

  // Get specific guide details
  async getGuide(req, res) {
    try {
      const { id } = req.params;
      const guide = this.guides.get(id);

      if (!guide || guide.status !== 'approved') {
        return res.status(404).json({
          success: false,
          error: 'GUIDE_NOT_FOUND',
          message: 'ガイドが見つかりません'
        });
      }

      res.json({
        success: true,
        guide: {
          id: guide.id,
          name: guide.guideName,
          email: guide.guideEmail,
          languages: guide.guideLanguages,
          introduction: guide.guideIntroduction,
          specialties: guide.guideSpecialties,
          experience: guide.guideExperience,
          sessionRate: guide.guideSessionRate,
          availability: guide.guideAvailability,
          profilePhoto: guide.profilePhoto?.fileName
        }
      });
    } catch (error) {
      console.error('❌ Get guide error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'ガイド情報の取得中にエラーが発生しました'
      });
    }
  }

  // Admin: Get all guides
  async getGuidesAdmin(req, res) {
    try {
      const allGuides = Array.from(this.guides.values()).map(guide => ({
        id: guide.id,
        name: guide.guideName,
        email: guide.guideEmail,
        phoneNumber: guide.phoneNumber,
        status: guide.status,
        registeredAt: guide.registeredAt,
        updatedAt: guide.updatedAt,
        sessionRate: guide.guideSessionRate,
        experience: guide.guideExperience
      }));

      res.json({
        success: true,
        guides: allGuides,
        total: allGuides.length
      });
    } catch (error) {
      console.error('❌ Admin get guides error:', error);
      res.status(500).json({
        success: false,
        error: 'FETCH_ERROR',
        message: 'ガイド情報の取得中にエラーが発生しました'
      });
    }
  }

  // Admin: Approve guide
  async approveGuide(req, res) {
    try {
      const { id } = req.params;
      const guide = this.guides.get(id);

      if (!guide) {
        return res.status(404).json({
          success: false,
          error: 'GUIDE_NOT_FOUND',
          message: 'ガイドが見つかりません'
        });
      }

      guide.status = 'approved';
      guide.updatedAt = new Date().toISOString();
      guide.approvedBy = req.adminUser.username;
      
      this.guides.set(id, guide);

      console.log(`✅ Guide approved: ${guide.guideName} (${id}) by ${req.adminUser.username}`);

      res.json({
        success: true,
        message: 'ガイドを承認しました',
        guide: {
          id: guide.id,
          name: guide.guideName,
          status: guide.status
        }
      });
    } catch (error) {
      console.error('❌ Guide approval error:', error);
      res.status(500).json({
        success: false,
        error: 'APPROVAL_ERROR',
        message: 'ガイド承認中にエラーが発生しました'
      });
    }
  }

  // Admin: Reject guide
  async rejectGuide(req, res) {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const guide = this.guides.get(id);

      if (!guide) {
        return res.status(404).json({
          success: false,
          error: 'GUIDE_NOT_FOUND',
          message: 'ガイドが見つかりません'
        });
      }

      guide.status = 'rejected';
      guide.rejectionReason = reason || '承認基準を満たしていません';
      guide.updatedAt = new Date().toISOString();
      guide.rejectedBy = req.adminUser.username;
      
      this.guides.set(id, guide);

      console.log(`❌ Guide rejected: ${guide.guideName} (${id}) by ${req.adminUser.username}`);

      res.json({
        success: true,
        message: 'ガイドを拒否しました',
        guide: {
          id: guide.id,
          name: guide.guideName,
          status: guide.status,
          rejectionReason: guide.rejectionReason
        }
      });
    } catch (error) {
      console.error('❌ Guide rejection error:', error);
      res.status(500).json({
        success: false,
        error: 'REJECTION_ERROR',
        message: 'ガイド拒否中にエラーが発生しました'
      });
    }
  }

  // Get guide by ID for editing
  async getGuideById(req, res) {
    try {
      const { id } = req.params;
      const guide = this.getGuideFromStorage(id);
      
      if (!guide) {
        return res.status(404).json({
          success: false,
          message: 'ガイドが見つかりません'
        });
      }

      res.json({
        success: true,
        guide: guide
      });

    } catch (error) {
      console.error('❌ Error getting guide:', error);
      res.status(500).json({
        success: false,
        message: 'ガイド情報の取得中にエラーが発生しました'
      });
    }
  }

  // Update guide information
  async updateGuide(req, res) {
    try {
      const { id } = req.params;
      const updates = req.body;
      
      const existingGuide = this.getGuideFromStorage(id);
      if (!existingGuide) {
        return res.status(404).json({
          success: false,
          message: 'ガイドが見つかりません'
        });
      }

      // Check for email change and validate uniqueness
      if (updates.guideEmail && updates.guideEmail.trim().toLowerCase() !== existingGuide.guideEmail.toLowerCase()) {
        const normalizedNewEmail = updates.guideEmail.trim().toLowerCase();
        const allGuides = this.loadGuides();
        const emailExists = allGuides.some(guide => 
          guide.id !== id && // Exclude current guide
          guide.guideEmail && 
          guide.guideEmail.toLowerCase() === normalizedNewEmail
        );
        
        if (emailExists) {
          return res.status(400).json({
            success: false,
            error: 'DUPLICATE_EMAIL',
            message: 'このメールアドレスは既に登録されています。別のメールアドレスをご使用ください。'
          });
        }
        
        // Normalize email before saving
        updates.guideEmail = updates.guideEmail.trim();
      }

      // Update guide data while preserving critical fields
      const updatedGuide = this.updateGuideInStorage(id, {
        ...updates,
        // Preserve critical fields
        id: existingGuide.id,
        phoneNumber: existingGuide.phoneNumber,
        phoneVerified: existingGuide.phoneVerified,
        documents: existingGuide.documents,
        registeredAt: existingGuide.registeredAt
      });

      if (updatedGuide) {
        console.log(`✅ Guide updated: ${updatedGuide.guideName} (${id})`);

        res.json({
          success: true,
          message: 'ガイド情報が正常に更新されました',
          guide: {
            id: updatedGuide.id,
            name: updatedGuide.guideName,
            email: updatedGuide.guideEmail,
            status: updatedGuide.status,
            updatedAt: updatedGuide.updatedAt
          }
        });
      } else {
        throw new Error('Guide update failed');
      }

    } catch (error) {
      console.error('❌ Error updating guide:', error);
      res.status(500).json({
        success: false,
        message: 'ガイド情報の更新中にエラーが発生しました'
      });
    }
  }

  // Check email availability (real-time validation)
  async checkEmailAvailability(req, res) {
    try {
      const { email } = req.query;
      
      if (!email || !email.trim()) {
        return res.status(400).json({
          success: false,
          message: 'メールアドレスを入力してください'
        });
      }

      const normalizedEmail = email.trim().toLowerCase();
      const allGuides = this.loadGuides();
      
      const emailExists = allGuides.some(guide => 
        guide.guideEmail && 
        guide.guideEmail.toLowerCase() === normalizedEmail
      );

      res.json({
        success: true,
        available: !emailExists,
        message: emailExists ? 'このメールアドレスは既に登録されています' : 'このメールアドレスは使用可能です'
      });

    } catch (error) {
      console.error('❌ Error checking email availability:', error);
      res.status(500).json({
        success: false,
        message: 'メールアドレスの確認中にエラーが発生しました'
      });
    }
  }

  // Cleanup expired sessions
  cleanupExpiredSessions() {
    const now = new Date();
    for (const [sessionId, session] of this.pendingRegistrations.entries()) {
      if (new Date(session.expiresAt) < now) {
        this.pendingRegistrations.delete(sessionId);
      }
    }
  }
}

// Create singleton instance
const guideAPIService = new GuideAPIService();

// Cleanup expired sessions every 10 minutes
setInterval(() => {
  guideAPIService.cleanupExpiredSessions();
}, 10 * 60 * 1000);

module.exports = { GuideAPIService, guideAPIService };