require('dotenv').config();
const bcrypt = require('bcrypt');
const mysql = require('mysql2/promise');

const ROUNDS = 10;

const CLINICS = [
  { name: 'ダミークリニック | Dummy Clinic', username: 'dummy_00', password: 'Dm@0000Xx' },
  { name: 'さくら歯科 | Sakura Dental Clinic', username: 'sakura_01', password: 'Sk@9182Xa' },
  { name: '金沢さくら医院 歯科 | Kanazawa Sakura Clinic Dental', username: 'kanazawa_02', password: 'Kz@4721Lp' },
  { name: 'ヒロデンタルクリニック | Hiro Dental Clinic', username: 'hiro_03', password: 'Hr@7745Qz' },
  { name: '町屋さくら歯科・矯正歯科 | Machiya Sakura Dental Orthodontics', username: 'machiya_04', password: 'Mc@6632Rt' },
  { name: 'さくら医院 歯科 | Sakura Clinic Dental', username: 'sakuraiin_05', password: 'Si@5521Bk' },
  { name: '春日井アップル歯科 | Kasugai Apple Dental', username: 'apple_06', password: 'Ap@4823Mn' },
  { name: 'グランド歯科医院 | Grand Dental Clinic', username: 'grand_07', password: 'Gd@9183Js' },
  { name: 'きた矯正歯科クリニック | Kita Orthodontic Clinic', username: 'kita_08', password: 'Kt@6612Pw' },
  { name: 'たんぽぽ歯科 | Tampopo Dental Clinic', username: 'tampopo_09', password: 'Tp@7741Er' },
  { name: '名駅さくら医院 歯科 | Meieki Sakura Clinic Dental', username: 'meieki_10', password: 'Me@3321Lo' },
  { name: '日進赤池たんぽぽ歯科 | Nisshin Akaike Tampopo Dental', username: 'nisshin_11', password: 'Ns@8421Uk' },
  { name: '金沢さくら医院 | Kanazawa Sakura Clinic', username: 'kanazawa_12', password: 'Kc@5532Yp' },
  { name: 'クローバー歯科 | Clover Dental Clinic', username: 'clover_13', password: 'Cv@6619Qa' },
  { name: '春日井きらり歯科 | Kasugai Kirari Dental', username: 'kirari_14', password: 'Kr@4728Zx' },
  { name: 'さくら医院 | Sakura Clinic', username: 'sakura_15', password: 'Sc@1932Mn' },
  { name: '長久手さくら歯科・矯正歯科 | Nagakute Sakura Dental Orthodontics', username: 'nagakute_16', password: 'Ng@8812Fd' },
  { name: '三田矯正歯科医院 | Mita Orthodontic Clinic', username: 'mita_17', password: 'Mt@7743Pa' },
  { name: '名駅さくら医院 皮膚科 | Meieki Sakura Clinic Dermatology', username: 'hifuka_18', password: 'Hf@6631Lo' },
  { name: 'ありす歯科 | Alice Dental Clinic', username: 'alice_19', password: 'Al@9921Re' },
  { name: '流山ハピネス歯科 | Nagareyama Happiness Dental', username: 'happiness_20', password: 'Hp@5512Qs' },
  { name: '松戸ありす歯科 | Matsudo Alice Dental', username: 'matsudo_21', password: 'Md@8842Xn' },
  { name: 'さくら春日井歯科 ヨロッカ春日井院 | Sakura Kasugai Yorocca Dental', username: 'yorocca_22', password: 'Yr@3392Lt' },
  { name: '流山ありす歯科・矯正歯科 | Nagareyama Alice Dental Orthodontics', username: 'arisu_23', password: 'Ar@1123Vm' },
  { name: '池下さくら歯科 | Ikeshita Sakura Dental', username: 'ikeshita_24', password: 'Ik@5519Za' },
  { name: 'きらり大森歯科 | Kirari Omori Dental', username: 'omori_25', password: 'Om@6638Qw' },
  { name: '祥南歯科・矯正歯科医院 | Shonan Dental Orthodontic Clinic', username: 'shonan_26', password: 'Sn@2284Er' },
  { name: 'デンタルオフィス増田 | Dental Office Masuda', username: 'masuda_27', password: 'Ms@7749Ty' },
];

const ADMIN = { username: 'admin', password: 'Admin@Clinic2024' };

async function seed() {
  const conn = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'clinic_db',
    charset: 'utf8mb4',
  });

  console.log('Seeding admin user...');
  const adminHash = await bcrypt.hash(ADMIN.password, ROUNDS);
  await conn.execute(
    `INSERT INTO users (username, password_hash, role) VALUES (?, ?, 'admin')
     ON DUPLICATE KEY UPDATE password_hash = VALUES(password_hash)`,
    [ADMIN.username, adminHash]
  );

  console.log(`Seeding ${CLINICS.length} clinics...`);
  for (const clinic of CLINICS) {
    const hash = await bcrypt.hash(clinic.password, ROUNDS);
    await conn.execute(
      `INSERT INTO clinics (name, username, password_hash, plain_password)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE
         name           = VALUES(name),
         password_hash  = VALUES(password_hash),
         plain_password = VALUES(plain_password)`,
      [clinic.name, clinic.username, hash, clinic.password]
    );
    process.stdout.write('.');
  }
  console.log('\nSeed complete.');
  await conn.end();
}

seed().catch((err) => { console.error(err); process.exit(1); });
