const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

async function migrateGuidesToDB() {
  console.log('🔄 Starting guide migration from JSON to PostgreSQL...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  try {
    const guidesFilePath = path.join(__dirname, '../data/guides.json');
    const guidesData = JSON.parse(fs.readFileSync(guidesFilePath, 'utf8'));

    console.log(`📋 Found ${guidesData.length} guides in JSON file`);

    let migratedCount = 0;
    let skippedCount = 0;

    for (const guide of guidesData) {
      const checkResult = await pool.query(
        'SELECT id FROM tourism_guides WHERE id = $1',
        [guide.id]
      );

      if (checkResult.rows.length > 0) {
        console.log(`⏭️ Skipping existing guide: ${guide.guideName || guide.name} (${guide.id})`);
        skippedCount++;
        continue;
      }

      const languages = Array.isArray(guide.guideLanguages) 
        ? guide.guideLanguages 
        : (guide.languages || ['日本語']);

      await pool.query(`
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
        )
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

      console.log(`✅ Migrated: ${guide.guideName || guide.name}`);
      migratedCount++;
    }

    console.log(`\n🎉 Migration complete!`);
    console.log(`   Migrated: ${migratedCount}`);
    console.log(`   Skipped (already exists): ${skippedCount}`);
    console.log(`   Total in DB: ${migratedCount + skippedCount}`);

  } catch (error) {
    console.error('❌ Migration error:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

migrateGuidesToDB().catch(console.error);
