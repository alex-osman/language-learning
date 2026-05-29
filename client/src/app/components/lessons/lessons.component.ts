import { Component, OnInit } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { LessonService, LessonSummaryDTO } from '../../services/lesson.service';

@Component({
  selector: 'app-lessons',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './lessons.component.html',
  styleUrls: ['./lessons.component.scss'],
})
export class LessonsComponent implements OnInit {
  lessons: LessonSummaryDTO[] = [];
  isLoading = true;
  error: string | null = null;

  constructor(private lessonService: LessonService, private router: Router) {}

  ngOnInit(): void {
    this.lessonService.getLessons().subscribe({
      next: (lessons) => {
        this.lessons = lessons;
        this.isLoading = false;
      },
      error: () => {
        this.error = 'Failed to load lessons.';
        this.isLoading = false;
      },
    });
  }

  progressPercent(lesson: LessonSummaryDTO): number {
    if (lesson.wordCount === 0) return 0;
    return Math.round(((lesson.seenCount + lesson.learningCount + lesson.learnedCount) / lesson.wordCount) * 100);
  }

  learnedPercent(lesson: LessonSummaryDTO): number {
    if (lesson.wordCount === 0) return 0;
    return Math.round((lesson.learnedCount / lesson.wordCount) * 100);
  }

  goToLesson(lessonNumber: number): void {
    this.router.navigate(['/lessons', lessonNumber]);
  }
}
