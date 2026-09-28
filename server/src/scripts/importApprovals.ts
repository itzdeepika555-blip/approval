import path from 'path';
import { datasetImportService } from '../services/datasetImport.service';

async function runImport() {
  console.log('====================================================');
  console.log(' SIH26130 Approval Dataset Ingestion & Validation');
  console.log(' Government of Maharashtra - Industry Single Window');
  console.log('====================================================');

  const templatesDir = path.resolve(__dirname, '../../data/templates');
  console.log(`[Import] Reading datasets from: ${templatesDir}`);

  const startTime = Date.now();
  const report = await datasetImportService.importDataset(templatesDir);
  const elapsedMs = Date.now() - startTime;

  console.log('\n--- DATA QUALITY & INGESTION REPORT ---');
  console.log(`Execution Time               : ${elapsedMs} ms`);
  console.log(`Total CSV Rows Read          : ${report.summary.totalRowsRead}`);
  console.log(`Successfully Processed       : ${report.summary.totalSuccessfullyImported}`);
  console.log(`Duplicates Handled/Updated   : ${report.summary.totalDuplicatesSkippedOrUpdated}`);
  console.log(`Invalid Rows Rejected        : ${report.summary.totalInvalidOrRejected}`);
  console.log(`Departments Active           : ${report.summary.departmentsCount}`);
  console.log(`Approvals Catalog Size       : ${report.summary.approvalsCount}`);
  console.log(`Active Statutory Rules       : ${report.summary.rulesCount}`);
  console.log(`Unique Statutory Docs Mapped : ${report.summary.uniqueRequiredDocumentsCount}`);
  console.log('----------------------------------------------------');

  for (const file of report.files) {
    console.log(`\nFile: ${file.fileName}`);
    console.log(`  Rows: ${file.totalRows} | Imported: ${file.importedRows} | Duplicates: ${file.duplicateRows} | Invalid: ${file.invalidRows}`);
    if (file.errors.length > 0) {
      console.log('  Errors:');
      file.errors.forEach(e => console.log(`    - ${e}`));
    }
    if (file.warnings.length > 0) {
      console.log('  Warnings:');
      file.warnings.forEach(w => console.log(`    - ${w}`));
    }
  }

  console.log('\n====================================================');
  console.log(' Ingestion Complete & Ready for Rule Matching');
  console.log('====================================================');
}

runImport().catch(err => {
  console.error('[Import Error] Ingestion script encountered an exception:', err);
  process.exit(1);
});
