import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db/mongoose';
import { College } from '@/lib/db/models/College';
import { Cutoff } from '@/lib/db/models/Cutoff';
import { parse } from 'csv-parse/sync';
import slugify from 'slugify';

export async function POST(req: Request) {
  try {
    // Basic auth check placeholder (would use NextAuth session here)
    // const session = await getServerSession();
    // if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const formData = await req.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    const fileContent = await file.text();
    
    // Parse the CSV
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });

    await dbConnect();

    let importedCount = 0;

    for (const record of records as any[]) {
      const {
        college_name,
        state,
        city,
        ownership,
        year,
        category,
        quota,
        round,
        closing_rank,
        score
      } = record;

      // Skip invalid rows
      if (!college_name || !year || !category || !closing_rank) {
        continue;
      }

      const slug = slugify(college_name, { lower: true, strict: true });

      // Upsert College
      const college = await College.findOneAndUpdate(
        { slug },
        {
          $setOnInsert: {
            name: college_name,
            location: { state: state || 'Unknown', city: city || 'Unknown' },
            ownership: ownership || 'Govt',
            isDataComplete: false,
          }
        },
        { upsert: true, new: true }
      );

      // Upsert Cutoff
      await Cutoff.findOneAndUpdate(
        {
          collegeId: college._id,
          year: Number(year),
          category: category,
          quota: quota || 'AIQ',
          round: Number(round) || 1,
        },
        {
          $set: {
            closingRank: Number(closing_rank),
            score: score ? Number(score) : undefined,
          }
        },
        { upsert: true }
      );

      importedCount++;
    }

    return NextResponse.json({ 
      success: true, 
      message: `Data imported successfully. Processed ${importedCount} records.` 
    });
  } catch (error: any) {
    console.error('CSV Import Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
