import { of } from 'rxjs';
import { ElementRef } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AnalyticsResponse, RecentBookingsResponse } from '../../core/services/analytics.service';

type ChartConfigRecord = Record<string, unknown>;
type CanvasContextStub = {
  createLinearGradient: jest.Mock<{ addColorStop: jest.Mock }, [number, number, number, number]>;
};
type DashboardComponentTestAccess = {
  ['charts']: { destroy: jest.Mock }[];
};

const chartInstances: { destroy: jest.Mock; config: ChartConfigRecord }[] = [];

jest.mock('chart.js', () => {
  class MockChart {
    static register = jest.fn();
    static defaults: Record<string, unknown> = {};
    destroy = jest.fn();

    constructor(_ctx: unknown, config: ChartConfigRecord) {
      chartInstances.push({ destroy: this.destroy, config });
    }
  }

  return {
    Chart: MockChart,
    registerables: [],
  };
});

import { DashboardComponent } from './dashboard.component';
import { AnalyticsService } from '../../core/services/analytics.service';

describe('DashboardComponent', () => {
  const analyticsService = {
    getAnalytics: jest.fn(),
    getRecentBookings: jest.fn(),
  };

  const analyticsResponse: AnalyticsResponse = {
    kpis: {
      total_bookings: 1200,
      total_revenue: 456000,
      success_rate: 92,
      avg_booking_value: 380,
      bookings_today: 15,
      revenue_today: 5800,
      pending_bookings: 3,
      failed_payments: 1,
    },
    monthly_revenue: [
      { month: 'Jan', revenue: 1000, bookings: 2 },
      { month: 'Feb', revenue: 2000, bookings: 4 },
    ],
    payment_breakdown: [
      { status: 'success', count: 8, percentage: 80 },
      { status: 'failed', count: 2, percentage: 20 },
    ],
    daily_stats: [
      { date: '2026-04-01', bookings: 3, revenue: 900 },
      { date: '2026-04-02', bookings: 5, revenue: 1400 },
    ],
    room_type_breakdown: [
      { room_type: 'suite', revenue: 4000, count: 4 },
      { room_type: 'deluxe', revenue: 2000, count: 2 },
    ],
  };

  const recentBookingsResponse: RecentBookingsResponse = {
    bookings: [
      {
        id: 1,
        booking_ref: 'BK001',
        user_name: 'Alex Doe',
        email: 'alex@example.com',
        status: 'confirmed',
        room: { hotel_name: 'Azure', room_type: 'suite' },
        check_in: '2026-04-10',
        total_amount: 500,
      },
    ],
    total: 1,
  };

  beforeEach(async () => {
    chartInstances.length = 0;
    analyticsService.getAnalytics.mockReset().mockReturnValue(of(analyticsResponse));
    analyticsService.getRecentBookings.mockReset().mockReturnValue(of(recentBookingsResponse));

    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsService },
      ],
    }).compileComponents();
  });

  function createCanvasRef(): ElementRef<HTMLCanvasElement> {
    const canvas = document.createElement('canvas');
    const gradient = { addColorStop: jest.fn() };
    const context: CanvasContextStub = {
      createLinearGradient: jest.fn<{ addColorStop: jest.Mock }, [number, number, number, number]>(() => gradient),
    };
    jest.spyOn(canvas, 'getContext').mockReturnValue(context as unknown as CanvasRenderingContext2D);
    return new ElementRef(canvas);
  }

  it('loads analytics, builds KPI cards, and renders charts', async () => {
    jest.useFakeTimers();

    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.revenueChartRef = createCanvasRef();
    component.statusChartRef = createCanvasRef();
    component.bookingsChartRef = createCanvasRef();

    component.ngOnInit();
    await jest.advanceTimersByTimeAsync(100);

    expect(analyticsService.getAnalytics).toHaveBeenCalledWith(30);
    expect(analyticsService.getRecentBookings).toHaveBeenCalledWith(5);
    expect(component.analytics()).toEqual(analyticsResponse);
    expect(component.totalRevenue()).toBe(3000);
    expect(component.kpiCards()).toHaveLength(8);
    expect(component.kpiCards()[0].value).toBe('1,200');
    expect(component.kpiCards()[1].value).toBe('$456.0k');
    expect(component.recentBookings()).toHaveLength(1);
    expect(component.getStatusBadge('confirmed')).toBe('badge--success');
    expect(component.getStatusBadge('unknown')).toBe('');
    expect(component.getBarWidth(2000)).toBe(50);
    expect(chartInstances).toHaveLength(3);

    jest.useRealTimers();
  });

  it('falls back to an empty recent bookings list when the response omits bookings', async () => {
    jest.useFakeTimers();
    analyticsService.getRecentBookings.mockReturnValueOnce(of({ bookings: [], total: 0 }));

    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.revenueChartRef = createCanvasRef();
    component.statusChartRef = createCanvasRef();
    component.bookingsChartRef = createCanvasRef();

    component.ngOnInit();
    await jest.advanceTimersByTimeAsync(100);

    expect(component.recentBookings()).toEqual([]);
    jest.useRealTimers();
  });

  it('executes chart callbacks for gradients and tooltip labels', async () => {
    jest.useFakeTimers();

    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.revenueChartRef = createCanvasRef();
    component.statusChartRef = createCanvasRef();
    component.bookingsChartRef = createCanvasRef();

    component.ngOnInit();
    await jest.advanceTimersByTimeAsync(100);

    const revenueConfig = chartInstances[0].config as {
      data: { datasets: [{ backgroundColor: (input: { chart: { ctx: CanvasContextStub } }) => { addColorStop: jest.Mock } }] };
      options: {
        plugins: { tooltip: { callbacks: { label: (input: { raw: number }) => string } } };
        scales: { y: { ticks: { callback: (value: number) => string } } };
      };
    };
    const revenueDataset = revenueConfig.data.datasets[0];
    const revenueLabel = revenueConfig.options.plugins.tooltip.callbacks.label({ raw: 1234 });
    const revenueTick = revenueConfig.options.scales.y.ticks.callback(4321);
    const revenueGradient = revenueDataset.backgroundColor({
      chart: {
        ctx: {
          createLinearGradient: jest.fn<{ addColorStop: jest.Mock }, [number, number, number, number]>(() => {
            const gradient = { addColorStop: jest.fn() };
            return gradient;
          }),
        },
      },
    });

    const bookingsConfig = chartInstances[2].config as {
      options: { plugins: { tooltip: { callbacks: { label: (input: { raw: number }) => string } } } };
    };
    const bookingsLabel = bookingsConfig.options.plugins.tooltip.callbacks.label({ raw: 7 });

    expect(revenueLabel).toBe(' $1,234');
    expect(revenueTick).toBe('$4,321');
    expect(revenueGradient.addColorStop).toHaveBeenCalledTimes(2);
    expect(bookingsLabel).toBe(' 7 bookings');

    jest.useRealTimers();
  });

  it('returns zero bar width when there is no room type data', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    component.analytics.set({ ...analyticsResponse, room_type_breakdown: [] });

    expect(component.getBarWidth(100)).toBe(0);
  });

  it('returns zero bar width when analytics data has not loaded yet', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;

    expect(component.getBarWidth(100)).toBe(0);
  });

  it('destroys charts on teardown', () => {
    const fixture = TestBed.createComponent(DashboardComponent);
    const component = fixture.componentInstance;
    const componentAccess = component as unknown as DashboardComponentTestAccess;
    componentAccess.charts = [
      { destroy: jest.fn() },
      { destroy: jest.fn() },
    ];

    component.ngOnDestroy();

    expect(comp