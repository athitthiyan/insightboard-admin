import {
  Component,
  ElementRef,
  OnDestroy,
  OnInit,
  ViewChild,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { AnalyticsResponse, AnalyticsService } from '../../core/services/analytics.service';

Chart.register(...registerables);

interface KPICard {
  icon: string;
  label: string;
  value: string;
  change: string;
  positive: boolean;
  color: string;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="dashboard">
      <div class="kpi-grid">
        @for (card of kpiCards(); track card.label; let i = $index) {
          <div class="kpi-card" [style]="'animation-delay:' + (i * 0.08) + 's'">
            <div class="kpi-card__header">
              <div class="kpi-card__icon" [style]="'background: ' + card.color + '22; color: ' + card.color">
                {{ card.icon }}
              </div>
              <span class="kpi-card__change" [class.positive]="card.positive" [class.negative]="!card.positive">
                {{ card.change }}
              </span>
            </div>
            <div class="kpi-card__value">{{ card.value }}</div>
            <div class="kpi-card__label">{{ card.label }}</div>
          </div>
        }
      </div>

      <div class="charts-row">
        <div class="chart-card chart-card--wide">
          <div class="chart-card__header">
            <div>
              <h3>Revenue Overview</h3>
              <p>Monthly revenue for the last 6 months</p>
            </div>
            <div class="chart-card__total">
              <span>Total</span>
              <strong>\${{ totalRevenue() | number:'1.0-0' }}</strong>
            </div>
          </div>
          <div class="chart-card__body">
            <canvas #revenueChart></canvas>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card__header">
            <div>
              <h3>Payment Status</h3>
              <p>Transaction breakdown</p>
            </div>
          </div>
          <div class="chart-card__body chart-card__body--donut">
            <canvas #statusChart></canvas>
            <div class="donut-center">
              <strong>{{ analytics()?.kpis?.success_rate }}%</strong>
              <span>Success Rate</span>
            </div>
          </div>
          <div class="chart-legend">
            @for (item of analytics()?.payment_breakdown || []; track item.status) {
              <div class="chart-legend__item">
                <span class="chart-legend__dot" [class]="'dot--' + item.status"></span>
                <span>{{ item.status | titlecase }}</span>
                <span class="chart-legend__pct">{{ item.percentage }}%</span>
              </div>
            }
          </div>
        </div>
      </div>

      <div class="chart-card chart-card--full">
        <div class="chart-card__header">
          <div>
            <h3>Daily Bookings</h3>
            <p>Booking activity for the last 30 days</p>
          </div>
        </div>
        <div class="chart-card__body">
          <canvas #bookingsChart></canvas>
        </div>
      </div>

      <div class="bottom-row">
        <div class="chart-card chart-card--wide">
          <div class="chart-card__header">
            <div>
              <h3>Recent Bookings</h3>
              <p>Latest 5 reservations</p>
            </div>
            <a routerLink="/bookings" class="btn btn--ghost btn--sm">View All ></a>
          </div>
          <div class="recent-table">
            <table>
              <thead>
                <tr>
                  <th>Guest</th>
                  <th>Hotel</th>
                  <th>Check-in</th>
                  <th>Amount</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                @for (b of recentBookings(); track b.id) {
                  <tr>
                    <td>
                      <div class="guest-cell">
                        <div class="guest-avatar">{{ b.user_name[0] }}</div>
                        <div>
                          <strong>{{ b.user_name }}</strong>
                          <span>{{ b.email }}</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <div>
                        <strong>{{ b.room?.hotel_name }}</strong>
                        <span class="room-type-pill">{{ b.room?.room_type }}</span>
                      </div>
                    </td>
                    <td>{{ b.check_in | date:'MMM d' }}</td>
                    <td><strong class="amount">\${{ b.total_amount | number:'1.0-0' }}</strong></td>
                    <td><span class="badge" [class]="getStatusBadge(b.status)">{{ b.status }}</span></td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>

        <div class="chart-card">
          <div class="chart-card__header">
            <h3>Room Type Revenue</h3>
          </div>
          @for (rt of analytics()?.room_type_breakdown || []; track rt.room_type) {
            <div class="room-type-bar">
              <div class="room-type-bar__info">
                <span>{{ rt.room_type | titlecase }}</span>
                <strong>\${{ rt.revenue | number:'1.0-0' }}</strong>
              </div>
              <div class="room-type-bar__track">
                <div class="room-type-bar__fill" [style]="'width: ' + getBarWidth(rt.revenue) + '%'"></div>
              </div>
              <span class="room-type-bar__count">{{ rt.count }} bookings</span>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard {
      display: flex;
      flex-direction: column;
      gap: 24px;
      animation: fadeInUp 0.5s ease;
    }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 16px;
    }

    .kpi-card {
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 16px;
      padding: 20px;
      animation: fadeInUp 0.5s ease both;
      transition: all 0.25s;
    }

    .kpi-card:hover {
      border-color: var(--ib-border-2);
      transform: translateY(-3px);
      box-shadow: var(--ib-shadow);
    }

    .kpi-card__header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .kpi-card__icon {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 20px;
    }

    .kpi-card__change {
      font-size: 12px;
      font-weight: 700;
      padding: 3px 8px;
      border-radius: 99px;
    }

    .kpi-card__change.positive {
      color: #22c55e;
      background: rgba(34, 197, 94, 0.12);
    }

    .kpi-card__change.negative {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.12);
    }

    .kpi-card__value {
      font-size: 1.9rem;
      font-weight: 800;
      color: var(--ib-text);
      line-height: 1;
      margin-bottom: 6px;
      animation: countUp 0.5s ease both;
      font-variant-numeric: tabular-nums;
    }

    .kpi-card__label {
      font-size: 13px;
      color: var(--ib-text-muted);
    }

    .charts-row,
    .bottom-row {
      display: grid;
      grid-template-columns: 1fr 340px;
      gap: 24px;
    }

    .chart-card {
      background: var(--ib-surface);
      border: 1px solid var(--ib-border);
      border-radius: 16px;
      padding: 24px;
      animation: fadeInUp 0.5s ease 0.2s both;
    }

    .chart-card--full { width: 100%; }

    .chart-card__header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 20px;
    }

    .chart-card__header h3 { font-size: 16px; font-weight: 700; color: var(--ib-text); }
    .chart-card__header p { font-size: 12px; color: var(--ib-text-muted); margin-top: 3px; }

    .chart-card__total { text-align: right; }
    .chart-card__total span { display: block; font-size: 11px; color: var(--ib-text-muted); }
    .chart-card__total strong { font-size: 1.2rem; font-weight: 800; color: var(--ib-primary-light); }

    .chart-card__body {
      position: relative;
      height: 260px;
    }

    .chart-card__body canvas { max-height: 100%; }

    .chart-card__body--donut {
      height: 200px;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
    }

    .donut-center {
      position: absolute;
      text-align: center;
      pointer-events: none;
    }

    .donut-center strong { display: block; font-size: 1.6rem; font-weight: 800; color: var(--ib-text); }
    .donut-center span { font-size: 11px; color: var(--ib-text-muted); }

    .chart-legend {
      margin-top: 16px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .chart-legend__item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: var(--ib-text-muted);
    }

    .chart-legend__dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .chart-legend__pct {
      margin-left: auto;
      font-weight: 600;
      color: var(--ib-text);
    }

    .dot--success { background: #22c55e; }
    .dot--failed { background: #ef4444; }
    .dot--pending { background: #f59e0b; }
    .dot--refunded { background: #22d3ee; }

    .recent-table { overflow-x: auto; }

    .recent-table table {
      width: 100%;
      border-collapse: collapse;
    }

    .recent-table th {
      padding: 10px 14px;
      text-align: left;
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 1px;
      color: var(--ib-primary-light);
      border-bottom: 1px solid var(--ib-border);
    }

    .recent-table td {
      padding: 14px;
      font-size: 13px;
      color: var(--ib-text-muted);
      border-bottom: 1px solid var(--ib-border);
      vertical-align: middle;
    }

    .recent-table td strong {
      display: block;
      color: var(--ib-text);
      font-size: 13px;
    }

    .recent-table td span { font-size: 11px; }
    .recent-table tr:last-child td { border-bottom: none; }
    .recent-table tr:hover td { background: rgba(255, 255, 255, 0.02); }

    .guest-cell {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .guest-avatar {
      width: 32px;
      height: 32px;
      border-radius: 8px;
      background: linear-gradient(135deg, var(--ib-primary), var(--ib-primary-dark));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 700;
      color: white;
      flex-shrink: 0;
    }

    .room-type-pill {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      text-transform: capitalize;
      background: rgba(99, 102, 241, 0.1);
      color: var(--ib-primary-light);
      padding: 2px 6px;
      border-radius: 4px;
      margin-top: 2px;
    }

    .amount { color: var(--ib-text) !important; font-size: 14px !important; }

    .room-type-bar { margin-bottom: 20px; }

    .room-type-bar__info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 6px;
    }

    .room-type-bar__info span { font-size: 13px; color: var(--ib-text-muted); }
    .room-type-bar__info strong { font-size: 13px; color: var(--ib-text); font-weight: 700; }

    .room-type-bar__track {
      height: 8px;
      background: var(--ib-surface-2);
      border-radius: 99px;
      overflow: hidden;
    }

    .room-type-bar__fill {
      height: 100%;
      background: linear-gradient(90deg, var(--ib-primary), var(--ib-accent));
      border-radius: 99px;
      transition: width 1s ease;
    }

    .room-type-bar__count {
      font-size: 11px;
      color: var(--ib-text-subtle);
      display: block;
      margin-top: 4px;
    }

    @media (max-width: 1200px) {
      .kpi-grid { grid-template-columns: repeat(2, 1fr); }
    }

    @media (max-width: 1100px) {
      .charts-row,
      .bottom-row { grid-template-columns: 1fr; }
    }

    @media (max-width: 600px) {
      .kpi-grid { grid-template-columns: 1fr; }
    }
  `],
})
export class DashboardComponent implements OnInit, OnDestroy {
  @ViewChild('revenueChart') revenueChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('statusChart') statusChartRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('bookingsChart') bookingsChartRef!: ElementRef<HTMLCanvasElement>;

  private analyticsService = inject(AnalyticsService);

  analytics = signal<AnalyticsResponse | null>(null);
  kpiCards = signal<KPICard[]>([]);
  recentBookings = signal<any[]>([]);
  totalRevenue = signal(0);

  private charts: Chart[] = [];

  ngOnInit() {
    this.analyticsService.getAnalytics(30).subscribe(data => {
      this.analytics.set(data);
      this.totalRevenue.set(data.monthly_revenue.reduce((s, m) => s + m.revenue, 0));
      this.buildKPICards(data.kpis);
      setTimeout(() => this.renderCharts(data), 100);
    });

    this.analyticsService.getRecentBookings(5).subscribe(res => {
      this.recentBookings.set(res.bookings || []);
    });
  }

  ngOnDestroy() {
    this.charts.forEach(chart => chart.destroy());
  }

  private buildKPICards(kpis: any) {
    this.kpiCards.set([
      { icon: 'B', label: 'Total Bookings', value: kpis.total_bookings.toLocaleString(), change: '+12.5%', positive: true, color: '#6366f1' },
      { icon: '$', label: 'Total Revenue', value: '$' + (kpis.total_revenue / 1000).toFixed(1) + 'k', change: '+29.4%', positive: true, color: '#22c55e' },
      { icon: 'S', label: 'Success Rate', value: kpis.success_rate + '%', change: '+2.1%', positive: true, color: '#22d3ee' },
      { icon: 'A', label: 'Avg Booking Value', value: '$' + kpis.avg_booking_value.toFixed(0), change: '-3.2%', positive: false, color: '#f59e0b' },
      { icon: 'T', label: 'Bookings Today', value: String(kpis.bookings_today), change: '+7', positive: true, color: '#a78bfa' },
      { icon: 'R', label: 'Revenue Today', value: '$' + kpis.revenue_today.toLocaleString(), change: '+$280', positive: true, color: '#34d399' },
      { icon: 'P', label: 'Pending Bookings', value: String(kpis.pending_bookings), change: '-2', positive: true, color: '#fbbf24' },
      { icon: 'F', label: 'Failed Payments', value: String(kpis.failed_payments), change: '+1', positive: false, color: '#f87171' },
    ]);
  }

  private renderCharts(data: AnalyticsResponse) {
    Chart.defaults.color = '#6b7fa5';

    if (this.revenueChartRef?.nativeElement) {
      const ctx = this.revenueChartRef.nativeElement.getContext('2d')!;
      const chart = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.monthly_revenue.map(m => m.month),
          datasets: [{
            label: 'Revenue',
            data: data.monthly_revenue.map(m => m.revenue),
            backgroundColor: context => {
              const gradient = context.chart.ctx.createLinearGradient(0, 0, 0, 300);
              gradient.addColorStop(0, 'rgba(99,102,241,0.8)');
              gradient.addColorStop(1, 'rgba(99,102,241,0.1)');
              return gradient;
            },
            borderColor: '#6366f1',
            borderWidth: 2,
            borderRadius: 8,
            borderSkipped: false,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a2237',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              padding: 12,
              callbacks: { label: context => ` $${Number(context.raw).toLocaleString()}` },
            },
          },
          scales: {
            x: { grid: { color: 'rgba(255,255,255,0.04)' }, ticks: { font: { size: 12 } } },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: {
                font: { size: 11 },
                callback: value => `$${Number(value).toLocaleString()}`,
              },
            },
          },
        },
      });
      this.charts.push(chart);
    }

    if (this.statusChartRef?.nativeElement) {
      const ctx = this.statusChartRef.nativeElement.getContext('2d')!;
      const chart = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.payment_breakdown.map(item => item.status),
          datasets: [{
            data: data.payment_breakdown.map(item => item.count),
            backgroundColor: ['#22c55e', '#ef4444', '#f59e0b', '#22d3ee'],
            borderColor: '#111827',
            borderWidth: 3,
            hoverBorderWidth: 0,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '72%',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a2237',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              padding: 10,
            },
          },
        },
      });
      this.charts.push(chart);
    }

    if (this.bookingsChartRef?.nativeElement) {
      const ctx = this.bookingsChartRef.nativeElement.getContext('2d')!;
      const gradient = ctx.createLinearGradient(0, 0, 0, 260);
      gradient.addColorStop(0, 'rgba(34,211,238,0.2)');
      gradient.addColorStop(1, 'rgba(34,211,238,0)');

      const chart = new Chart(ctx, {
        type: 'line',
        data: {
          labels: data.daily_stats.map(day => {
            const date = new Date(day.date);
            return `${date.getMonth() + 1}/${date.getDate()}`;
          }),
          datasets: [{
            label: 'Bookings',
            data: data.daily_stats.map(day => day.bookings),
            borderColor: '#22d3ee',
            borderWidth: 2.5,
            fill: true,
            backgroundColor: gradient,
            tension: 0.4,
            pointBackgroundColor: '#22d3ee',
            pointRadius: 3,
            pointHoverRadius: 6,
          }],
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: '#1a2237',
              borderColor: 'rgba(255,255,255,0.1)',
              borderWidth: 1,
              padding: 10,
              callbacks: { label: context => ` ${context.raw} bookings` },
            },
          },
          scales: {
            x: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { font: { size: 11 }, maxTicksLimit: 10 },
            },
            y: {
              grid: { color: 'rgba(255,255,255,0.04)' },
              ticks: { font: { size: 11 }, precision: 0 },
            },
          },
        },
      });
      this.charts.push(chart);
    }
  }

  getStatusBadge(status: string): string {
    const map: Record<string, string> = {
      confirmed: 'badge--success',
      pending: 'badge--warning',
      cancelled: 'badge--error',
      completed: 'badge--info',
    };
    return map[status] || '';
  }

  getBarWidth(revenue: number): number {
    const max = Math.max(...(this.analytics()?.room_type_breakdown || []).map(item => item.revenue));
    return max > 0 ? Math.round((revenue / max) * 100) : 0;
  }
}
