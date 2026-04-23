import {
  Component, Input, OnInit, OnChanges,
  OnDestroy, ElementRef, ViewChild, AfterViewInit
} from '@angular/core';
import { NgIf } from '@angular/common';
import {
  Chart, ChartType, ChartData, ChartOptions,
  BarController, LineController, PieController, DoughnutController,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler
} from 'chart.js';

Chart.register(
  BarController, LineController, PieController, DoughnutController,
  CategoryScale, LinearScale, BarElement, LineElement, PointElement,
  ArcElement, Tooltip, Legend, Filler
);

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [NgIf],
  template: `
    <div class="chart-wrap">
      <div class="chart-title" *ngIf="title">{{ title }}</div>
      <div class="canvas-box">
        <canvas #canvas></canvas>
      </div>
    </div>
  `,
  styles: [`
    .chart-wrap {
      background: #161b2e;
      border: 1px solid #1e2535;
      border-radius: 14px;
      padding: 20px;
    }
    .chart-title {
      font-size: 14px;
      font-weight: 600;
      color: #94a3b8;
      margin-bottom: 16px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .canvas-box {
      position: relative;
      height: 220px;
    }
    canvas { display: block; }
  `]
})
export class ChartComponent implements OnInit, OnChanges, OnDestroy, AfterViewInit {
  @ViewChild('canvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @Input() type: ChartType = 'bar';
  @Input() labels: string[] = [];
  @Input() datasets: any[] = [];
  @Input() title = '';
  @Input() height = 220;

  private chart: Chart | null = null;
  private ready = false;

  ngAfterViewInit() {
    this.ready = true;
    this.buildChart();
  }

  ngOnInit() {}

  ngOnChanges() {
    if (this.ready) {
      this.buildChart();
    }
  }

  ngOnDestroy() {
    this.chart?.destroy();
  }

  private buildChart() {
    if (!this.canvasRef || !this.labels.length || !this.datasets.length) return;
    this.chart?.destroy();

    const ctx = this.canvasRef.nativeElement.getContext('2d')!;

    const defaults: ChartOptions = {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          labels: { color: '#94a3b8', font: { size: 12 }, boxWidth: 14 }
        },
        tooltip: {
          backgroundColor: '#1e2535',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: '#2d3748',
          borderWidth: 1,
        }
      },
      scales: (this.type === 'pie' || this.type === 'doughnut') ? {} : {
        x: {
          grid: { color: '#1e2535' },
          ticks: { color: '#64748b', font: { size: 11 } }
        },
        y: {
          grid: { color: '#1e2535' },
          ticks: { color: '#64748b', font: { size: 11 } },
          beginAtZero: true
        }
      }
    };

    this.chart = new Chart(ctx, {
      type: this.type,
      data: { labels: this.labels, datasets: this.datasets },
      options: defaults
    });
  }
}
