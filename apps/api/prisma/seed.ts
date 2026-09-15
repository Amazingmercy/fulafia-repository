import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

// All FULafia departments extracted from departments.json (departments only, not faculties)
const DEPARTMENTS = [
  // Faculty of Agriculture
  { name: 'Agric Economics and Extension',              code: 'AEE', faculty: 'Faculty of Agriculture' },
  { name: 'Agriculture (Agronomy/Animal Science)',       code: 'AGR', faculty: 'Faculty of Agriculture' },
  { name: 'Fisheries and Aquaculture',                   code: 'FIS', faculty: 'Faculty of Agriculture' },
  { name: 'Forestry and Wildlife Management',            code: 'FWM', faculty: 'Faculty of Agriculture' },
  // Faculty of Arts
  { name: 'Arabic Studies',                             code: 'ARA', faculty: 'Faculty of Arts' },
  { name: 'Christian Religious Studies',                 code: 'CRS', faculty: 'Faculty of Arts' },
  { name: 'English and Literary Studies',                code: 'ELS', faculty: 'Faculty of Arts' },
  { name: 'French',                                      code: 'FRN', faculty: 'Faculty of Arts' },
  { name: 'History and International Studies',           code: 'HIS', faculty: 'Faculty of Arts' },
  { name: 'Islamic Studies',                             code: 'ISL', faculty: 'Faculty of Arts' },
  { name: 'Nigerian Languages (Hausa Language)',         code: 'NLH', faculty: 'Faculty of Arts' },
  { name: 'Philosophy',                                  code: 'PHI', faculty: 'Faculty of Arts' },
  { name: 'Theatre and Media Arts',                      code: 'TMA', faculty: 'Faculty of Arts' },
  { name: 'Fine Arts',                                   code: 'FNA', faculty: 'Faculty of Arts' },
  // Faculty of Computing
  { name: 'Computer Science',                            code: 'CSC', faculty: 'Faculty of Computing' },
  { name: 'Cyber Security',                              code: 'CYS', faculty: 'Faculty of Computing' },
  { name: 'Information Technology',                      code: 'IFT', faculty: 'Faculty of Computing' },
  // Faculty of Education
  { name: 'Education & Integrated Science',              code: 'EIS', faculty: 'Faculty of Education' },
  { name: 'Education & Biology',                         code: 'EBL', faculty: 'Faculty of Education' },
  { name: 'Education & Chemistry',                       code: 'ECH', faculty: 'Faculty of Education' },
  { name: 'Education & Computer Science',                code: 'ECS', faculty: 'Faculty of Education' },
  { name: 'Education & Mathematics',                     code: 'EMT', faculty: 'Faculty of Education' },
  { name: 'Education & Physics',                         code: 'EPH', faculty: 'Faculty of Education' },
  { name: 'Education and French',                        code: 'EFR', faculty: 'Faculty of Education' },
  { name: 'Education and Geography',                     code: 'EGG', faculty: 'Faculty of Education' },
  { name: 'Education and History',                       code: 'EHI', faculty: 'Faculty of Education' },
  { name: 'Health Education',                            code: 'HED', faculty: 'Faculty of Education' },
  { name: 'Human Kinetics',                              code: 'HKN', faculty: 'Faculty of Education' },
  { name: 'Education and Christian Religious Studies',   code: 'ECR', faculty: 'Faculty of Education' },
  { name: 'Education and Arabic',                        code: 'EAR', faculty: 'Faculty of Education' },
  { name: 'Educational Management',                      code: 'EDM', faculty: 'Faculty of Education' },
  { name: 'Primary Education Studies',                   code: 'PES', faculty: 'Faculty of Education' },
  { name: 'Early Childhood Education',                   code: 'ECE', faculty: 'Faculty of Education' },
  { name: 'Guidance and Counselling',                    code: 'GCC', faculty: 'Faculty of Education' },
  { name: 'Adult Education',                             code: 'ADE', faculty: 'Faculty of Education' },
  { name: 'Education and English Language',              code: 'EEL', faculty: 'Faculty of Education' },
  { name: 'Education and Hausa',                         code: 'EHA', faculty: 'Faculty of Education' },
  { name: 'Social Studies and Civic Education',          code: 'SCE', faculty: 'Faculty of Education' },
  { name: 'Economics Education',                         code: 'ECE2', faculty: 'Faculty of Education' },
  { name: 'Creative Arts Education',                     code: 'CAE', faculty: 'Faculty of Education' },
  { name: 'Language Arts and Communication',             code: 'LAC', faculty: 'Faculty of Education' },
  // Faculty of Management Science
  { name: 'Accounting',                                  code: 'ACC', faculty: 'Faculty of Management Science' },
  { name: 'Business Administration',                     code: 'BUS', faculty: 'Faculty of Management Science' },
  { name: 'Entrepreneurship Studies',                    code: 'ENT', faculty: 'Faculty of Management Science' },
  { name: 'Procurement Management',                      code: 'PCM', faculty: 'Faculty of Management Science' },
  { name: 'Public Administration',                       code: 'PBA', faculty: 'Faculty of Management Science' },
  { name: 'Petroleum Information Management',            code: 'PIM', faculty: 'Faculty of Management Science' },
  // Faculty of Science
  { name: 'Anatomy',                                     code: 'ANT', faculty: 'Faculty of Science' },
  { name: 'Biochemistry',                                code: 'BCH', faculty: 'Faculty of Science' },
  { name: 'Biology (Plant Science and Bio Technology)',  code: 'BIO', faculty: 'Faculty of Science' },
  { name: 'Chemistry',                                   code: 'CHM', faculty: 'Faculty of Science' },
  { name: 'Geography',                                   code: 'GEO', faculty: 'Faculty of Science' },
  { name: 'Geology',                                     code: 'GLG', faculty: 'Faculty of Science' },
  { name: 'Industrial Chemistry',                        code: 'ICH', faculty: 'Faculty of Science' },
  { name: 'Mathematics',                                 code: 'MTH', faculty: 'Faculty of Science' },
  { name: 'Microbiology',                                code: 'MCB', faculty: 'Faculty of Science' },
  { name: 'Physics',                                     code: 'PHY', faculty: 'Faculty of Science' },
  { name: 'Science Laboratory Technology',               code: 'SLT', faculty: 'Faculty of Science' },
  { name: 'Statistics',                                  code: 'STA', faculty: 'Faculty of Science' },
  { name: 'Zoology',                                     code: 'ZOO', faculty: 'Faculty of Science' },
  { name: 'Glass and Silicate Technology',               code: 'GST', faculty: 'Faculty of Science' },
  { name: 'Industrial Design',                           code: 'IND', faculty: 'Faculty of Science' },
  // Faculty of Social Sciences
  { name: 'Criminology and Security Studies',            code: 'CSS', faculty: 'Faculty of Social Sciences' },
  { name: 'Economics',                                   code: 'ECO', faculty: 'Faculty of Social Sciences' },
  { name: 'Mass Communication',                          code: 'MCM', faculty: 'Faculty of Social Sciences' },
  { name: 'Political Science',                           code: 'POL', faculty: 'Faculty of Social Sciences' },
  { name: 'Psychology',                                  code: 'PSY', faculty: 'Faculty of Social Sciences' },
  { name: 'Social Work',                                 code: 'SWK', faculty: 'Faculty of Social Sciences' },
  { name: 'Sociology',                                   code: 'SOC', faculty: 'Faculty of Social Sciences' },
  { name: 'Library and Information Science',             code: 'LIS', faculty: 'Faculty of Social Sciences' },
  // College of Medicine
  { name: 'Medicine and Surgery',                        code: 'MDS', faculty: 'College of Medicine' },
  { name: 'Nursing',                                     code: 'NRS', faculty: 'College of Medicine' },
  { name: 'Medical Laboratory Science',                  code: 'MLS', faculty: 'College of Medicine' },
  { name: 'Physiology',                                  code: 'PYS', faculty: 'College of Medicine' },
  { name: 'Radiography',                                 code: 'RAD', faculty: 'College of Medicine' },
];

async function main() {
  console.log('🌱 Seeding FULafia Institutional Repository database...');
  console.log(`   Departments to seed: ${DEPARTMENTS.length}`);

  // 1. Upsert all departments
  const deptMap: Record<string, string> = {}; // code → id
  for (const dept of DEPARTMENTS) {
    const record = await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name, faculty: dept.faculty },
      create: dept,
    });
    deptMap[dept.code] = record.id;
  }
  console.log(`   ✓ ${DEPARTMENTS.length} departments seeded`);

  // 2. Hash default password with Argon2id
  const defaultPasswordHash = await argon2.hash('FULafiaRepo2026!', {
    type: argon2.argon2id,
  });

  // 3. Create seed Users — placed in Computer Science dept
  const cscId = deptMap['CSC'];

  const admin = await prisma.user.upsert({
    where: { email: 'admin@fulafia.edu.ng' },
    update: {},
    create: {
      email: 'admin@fulafia.edu.ng',
      passwordHash: defaultPasswordHash,
      firstName: 'System',
      lastName: 'Administrator',
      role: 'ADMIN',
      departmentId: cscId,
    },
  });

  const supervisor = await prisma.user.upsert({
    where: { email: 'prof.adewale@fulafia.edu.ng' },
    update: {},
    create: {
      email: 'prof.adewale@fulafia.edu.ng',
      passwordHash: defaultPasswordHash,
      firstName: 'Prof. Olumide',
      lastName: 'Adewale',
      role: 'SUPERVISOR',
      departmentId: cscId,
    },
  });

  const reviewer = await prisma.user.upsert({
    where: { email: 'librarian@fulafia.edu.ng' },
    update: {},
    create: {
      email: 'librarian@fulafia.edu.ng',
      passwordHash: defaultPasswordHash,
      firstName: 'Dr. Amina',
      lastName: 'Bello',
      role: 'REVIEWER',
      departmentId: deptMap['LIS'], // Library & Information Science — appropriate for a librarian
    },
  });

  const student = await prisma.user.upsert({
    where: { email: 'student.chidi@fulafia.edu.ng' },
    update: {},
    create: {
      email: 'student.chidi@fulafia.edu.ng',
      passwordHash: defaultPasswordHash,
      firstName: 'Chidi',
      lastName: 'Okonkwo',
      role: 'STUDENT',
      departmentId: cscId,
    },
  });

  console.log('   ✓ 4 seed users created');

  // 4. Create Sample Published Submission
  await prisma.submission.upsert({
    where: { stableIdentifier: 'FULAFIA-2026-TH-001' },
    update: {},
    create: {
      stableIdentifier: 'FULAFIA-2026-TH-001',
      title: 'Distributed Consensus Algorithms for Secure Institutional Data Repositories in Sub-Saharan Africa',
      abstract: 'This research presents a novel lightweight fault-tolerant consensus mechanism engineered for university repositories operating in environments with constrained network infrastructure. We analyze performance across multi-node topologies.',
      keywords: ['Distributed Systems', 'Consensus Algorithms', 'Institutional Repositories', 'FULafia'],
      documentType: 'THESIS',
      year: 2026,
      degreeProgramme: 'M.Sc. Computer Science',
      status: 'PUBLISHED',
      authorId: student.id,
      supervisorId: supervisor.id,
      departmentId: cscId,
      doi: '10.5281/fulafia.fulafia-2026-th-001',
      handleId: '123456789/fulafia-2026-th-001',
      versions: {
        create: {
          versionNumber: 1,
          title: 'Distributed Consensus Algorithms for Secure Institutional Data Repositories in Sub-Saharan Africa',
          abstract: 'This research presents a novel lightweight fault-tolerant consensus mechanism engineered for university repositories.',
          fullTextContent: 'Distributed Consensus Algorithms for Secure Institutional Data Repositories in Sub-Saharan Africa. Abstract: This research presents a novel lightweight fault-tolerant consensus mechanism engineered for university repositories operating in environments with constrained network infrastructure.',
          sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
          externalReport: {
            create: {
              provider: 'TURNITIN_SIMILARITY_API',
              externalJobId: 'turnitin-job-seed-01',
              status: 'COMPLETED',
              overallSimilarityPercentage: 11.2,
              compareStudentPapers: true,
              compareInstitutional: true,
              compareInternet: true,
              submitToRepo: true,
              matchedSources: [
                {
                  sourceId: 'src-101',
                  title: 'IEEE Transactions on Parallel & Distributed Systems, 2023',
                  publicationOrInstitution: 'IEEE Xplore',
                  similarityPercentage: 7.1,
                  matchedTextSnippet: 'consensus mechanism engineered for university repositories...',
                },
              ],
            },
          },
          internalReport: {
            create: {
              status: 'COMPLETED',
              overallSimilarityPercentage: 3.5,
              topMatches: [],
            },
          },
        },
      },
    },
  });

  console.log('   ✓ Sample published submission seeded');
  console.log('\n✅ Seeding completed successfully!\n');
  console.log('Test credentials (password: FULafiaRepo2026!):');
  console.log('  Admin:      admin@fulafia.edu.ng');
  console.log('  Supervisor: prof.adewale@fulafia.edu.ng');
  console.log('  Reviewer:   librarian@fulafia.edu.ng');
  console.log('  Student:    student.chidi@fulafia.edu.ng');
  console.log(`\nTotal departments seeded: ${DEPARTMENTS.length}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
