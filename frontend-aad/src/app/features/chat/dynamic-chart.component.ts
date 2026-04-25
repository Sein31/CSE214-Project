import { Component, Input, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-dynamic-chart',
  standalone: true,
  template: `<div style="position:relative; width:100%; height:200px;"><canvas #chartCanvas></canvas></div>`,
  styles: []
})
export class DynamicChartComponent implements AfterViewInit, OnDestroy {
  @Input() vizData: any;
  @ViewChild('chartCanvas') canvasRef!: ElementRef;
  chart: any;

  ngAfterViewInit() {
    setTimeout(() => this.renderChart(), 100);
  }

  ngOnDestroy() {
    if (this.chart) this.chart.destroy();
  }

  renderChart() {
    if (!this.vizData || !this.vizData.raw_data || !this.canvasRef) return;
    const ctx = this.canvasRef.nativeElement.getContext('2d');
    
    let type = this.vizData.chart_type;
    if (type === 'column') type = 'bar';
    if (!['bar', 'line', 'pie', 'doughnut'].includes(type)) return;

    const labels = this.vizData.raw_data.map((r: any) => r[this.vizData.x_column] ?? 'Bilinmeyen');
    const data = this.vizData.raw_data.map((r: any) => Number(r[this.vizData.y_column]) || 0);
    const colors = ['#00d4aa', '#0096ff', '#7c3aed', '#f59e0b', '#ec4899', '#10b981', '#6366f1'];

    this.chart = new Chart(ctx, {
      type: type as any,
      data: {
        labels,
        datasets: [{
          label: this.vizData.y_column || 'Değer',
          data,
          backgroundColor: (type === 'pie' || type === 'doughnut') ? colors : 'rgba(0, 212, 170, 0.6)',
          borderColor: (type === 'pie' || type === 'doughnut') ? '#1e293b' : '#00d4aa',
          borderWidth: 1,
          tension: 0.3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: (type === 'pie' || type === 'doughnut'), labels: { color: '#e2e8f0' } }
        },
        scales: (type === 'pie' || type === 'doughnut') ? undefined : {
          x: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' } },
          y: { ticks: { color: '#94a3b8' }, grid: { color: '#1e293b' }, beginAtZero: true }
        }
      }
    });
  }
}
