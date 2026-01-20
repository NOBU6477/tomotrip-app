const { Pool } = require('pg');

class GuideDbService {
  constructor() {
    this.pool = null;
    this._connected = false;
    this.initPool();
  }

  initPool() {
    if (!process.env.DATABASE_URL) {
      console.warn('⚠️ DATABASE_URL not set - using file storage fallback');
      return;
    }

    try {
      this.pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 5000,
      });

      this.pool.on('connect', () => {
        this._connected = true;
        console.log('✅ PostgreSQL connected for guides');
      });

      this.pool.on('error', (err) => {
        console.error('❌ PostgreSQL pool error:', err.message);
        this._connected = false;
      });

      console.log('✅ PostgreSQL pool initialized for guides');
    } catch (error) {
      console.error('❌ Failed to initialize PostgreSQL pool:', error);
      this._connected = false;
    }
  }

  async loadAllGuides() {
    if (!this.pool) {
      return null; // No pool - signal to use fallback
    }

    try {
      const result = await this.pool.query(`
        SELECT * FROM tourism_guides 
        ORDER BY created_at DESC
      `);

      this._connected = true;
      const guides = result.rows.map(row => this.dbRowToGuide(row));
      console.log(`📊 [DB] Loaded ${guides.length} guides from PostgreSQL`);
      return guides;
    } catch (error) {
      console.error('❌ [DB] Failed to load guides:', error.message);
      this._connected = false;
      return null; // Return null to signal fallback needed
    }
  }

  async loadApprovedGuides() {
    if (!this.pool) {
      return null; // No pool - signal to use fallback
    }

    try {
      const result = await this.pool.query(`
        SELECT * FROM tourism_guides 
        WHERE status = 'approved'
        ORDER BY created_at DESC
      `);

      this._connected = true; // Mark as connected on successful query
      const guides = result.rows.map(row => this.dbRowToGuide(row));
      console.log(`📊 [DB] Loaded ${guides.length} approved guides from PostgreSQL`);
      return guides;
    } catch (error) {
      console.error('❌ [DB] Failed to load approved guides:', error.message);
      this._connected = false; // Mark as disconnected on failure
      return null; // Return null to signal fallback needed
    }
  }

  async getGuideById(id) {
    if (!this.pool) {
      return null; // No pool - signal to use fallback
    }

    try {
      const result = await this.pool.query(
        'SELECT * FROM tourism_guides WHERE id = $1',
        [id]
      );

      this._connected = true;
      if (result.rows.length === 0) return undefined; // "not found" - distinct from null
      return this.dbRowToGuide(result.rows[0]);
    } catch (error) {
      console.error('❌ [DB] Failed to get guide by ID:', error.message);
      this._connected = false;
      return null; // Return null to signal fallback needed
    }
  }

  async getGuideByEmail(email) {
    if (!this.pool) {
      throw new Error('DB_NOT_CONFIGURED');
    }

    try {
      const normalizedEmail = email.trim().toLowerCase();
      const result = await this.pool.query(
        'SELECT * FROM tourism_guides WHERE LOWER(email) = $1',
        [normalizedEmail]
      );

      this._connected = true;
      if (result.rows.length === 0) return undefined; // "not found" - distinct from error
      return this.dbRowToGuide(result.rows[0]);
    } catch (error) {
      console.error('❌ [DB] Failed to get guide by email:', error.message);
      this._connected = false;
      throw error; // Re-throw to signal DB error
    }
  }

  isConnected() {
    return this.pool !== null && this._connected;
  }

  async testConnection() {
    if (!this.pool) return false;
    try {
      await this.pool.query('SELECT 1');
      this._connected = true;
      return true;
    } catch (error) {
      console.error('❌ [DB] Connection test failed:', error.message);
      this._connected = false;
      return false;
    }
  }

  async addGuide(guide) {
    if (!this.pool) {
      throw new Error('DB_NOT_CONFIGURED');
    }

    try {
      const languages = Array.isArray(guide.guideLanguages) 
        ? guide.guideLanguages 
        : (guide.languages || ['日本語']);

      const result = await this.pool.query(`
        INSERT INTO tourism_guides (
          id, guide_name, email, phone, gender, age, languages, 
          registration_language, experience, introduction, specialties,
          hourly_rate, availability, status, profile_image_url,
          location, guide_type, extension_policy, late_night_policy,
          achievements, multi_lingual, hospitality_support, emergency_support,
          local_expert, phone_verified, created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11,
          $12, $13, $14, $15,
          $16, $17, $18, $19,
          $20, $21, $22, $23,
          $24, $25, $26, $27
        ) RETURNING *
      `, [
        guide.id,
        guide.guideName || guide.name,
        guide.guideEmail || guide.email,
        guide.phoneNumber || guide.phone,
        guide.guideGender || guide.gender,
        parseInt(guide.guideAge || guide.age) || null,
        JSON.stringify(languages),
        guide.registrationLanguage || 'ja',
        guide.guideExperience || guide.experience || 'intermediate',
        guide.guideIntroduction || guide.introduction,
        guide.guideSpecialties || guide.specialties,
        parseFloat(guide.guideSessionRate || guide.hourlyRate) || null,
        guide.guideAvailability || guide.availability || 'both',
        guide.status || 'approved',
        guide.profileImageUrl || guide.profilePhoto,
        guide.location,
        guide.guideType || 'day',
        guide.extensionPolicy || 'ask',
        guide.lateNightPolicy || 'no',
        guide.achievements,
        guide.multiLingual || false,
        guide.hospitalitySupport || false,
        guide.emergencySupport || false,
        guide.localExpert || false,
        guide.phoneVerified || false,
        guide.registeredAt ? new Date(guide.registeredAt) : new Date(),
        guide.updatedAt ? new Date(guide.updatedAt) : new Date()
      ]);

      this._connected = true;
      console.log(`✅ [DB] Added guide: ${guide.guideName || guide.name}`);
      return this.dbRowToGuide(result.rows[0]);
    } catch (error) {
      console.error('❌ [DB] Failed to add guide:', error.message);
      this._connected = false;
      throw error; // Re-throw to signal DB error
    }
  }

  async updateGuide(id, updates) {
    if (!this.pool) {
      return null; // No pool - signal to use fallback
    }

    try {
      const setClauses = [];
      const values = [];
      let paramIndex = 1;

      const fieldMap = {
        guideName: 'guide_name',
        guideEmail: 'email',
        phoneNumber: 'phone',
        guideGender: 'gender',
        guideAge: 'age',
        guideLanguages: 'languages',
        registrationLanguage: 'registration_language',
        guideExperience: 'experience',
        guideIntroduction: 'introduction',
        guideSpecialties: 'specialties',
        guideSessionRate: 'hourly_rate',
        guideAvailability: 'availability',
        status: 'status',
        profileImageUrl: 'profile_image_url',
        location: 'location',
        guideType: 'guide_type',
        extensionPolicy: 'extension_policy',
        lateNightPolicy: 'late_night_policy',
        achievements: 'achievements',
        multiLingual: 'multi_lingual',
        hospitalitySupport: 'hospitality_support',
        emergencySupport: 'emergency_support',
        localExpert: 'local_expert',
        phoneVerified: 'phone_verified'
      };

      for (const [key, value] of Object.entries(updates)) {
        const dbField = fieldMap[key];
        if (dbField) {
          setClauses.push(`${dbField} = $${paramIndex}`);
          if (key === 'guideLanguages') {
            values.push(JSON.stringify(value));
          } else if (key === 'guideAge' || key === 'guideSessionRate') {
            values.push(parseFloat(value) || null);
          } else {
            values.push(value);
          }
          paramIndex++;
        }
      }

      setClauses.push(`updated_at = $${paramIndex}`);
      values.push(new Date());
      paramIndex++;

      values.push(id);

      const query = `
        UPDATE tourism_guides 
        SET ${setClauses.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING *
      `;

      const result = await this.pool.query(query, values);
      this._connected = true;
      
      if (result.rows.length === 0) return undefined; // "not found" - distinct from null

      console.log(`✅ [DB] Updated guide: ${id}`);
      return this.dbRowToGuide(result.rows[0]);
    } catch (error) {
      console.error('❌ [DB] Failed to update guide:', error.message);
      this._connected = false;
      return null; // Return null to signal fallback needed
    }
  }

  dbRowToGuide(row) {
    let languages = [];
    if (row.languages) {
      if (typeof row.languages === 'string') {
        try {
          languages = JSON.parse(row.languages);
        } catch {
          languages = [row.languages];
        }
      } else if (Array.isArray(row.languages)) {
        languages = row.languages;
      }
    }

    return {
      id: row.id,
      guideName: row.guide_name,
      guideEmail: row.email,
      phoneNumber: row.phone,
      guideGender: row.gender,
      guideAge: row.age,
      guideLanguages: languages,
      registrationLanguage: row.registration_language || 'ja',
      guideExperience: row.experience,
      guideIntroduction: row.introduction,
      guideSpecialties: row.specialties,
      guideSessionRate: row.hourly_rate,
      guideAvailability: row.availability,
      status: row.status,
      profileImageUrl: row.profile_image_url,
      location: row.location,
      guideType: row.guide_type,
      extensionPolicy: row.extension_policy || 'ask',
      lateNightPolicy: row.late_night_policy || 'no',
      achievements: row.achievements,
      multiLingual: row.multi_lingual,
      hospitalitySupport: row.hospitality_support,
      emergencySupport: row.emergency_support,
      localExpert: row.local_expert,
      phoneVerified: row.phone_verified,
      registeredAt: row.created_at?.toISOString(),
      updatedAt: row.updated_at?.toISOString()
    };
  }
}

const guideDbService = new GuideDbService();
module.exports = { guideDbService };
