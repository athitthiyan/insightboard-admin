import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SidebarComponent } from './sidebar.component';

describe('SidebarComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidebarComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders nav items and channel links', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    fixture.detectChanges();

    const component = fixture.componentInstance;
    const element = fixture.nativeElement as HTMLElement;

    expect(component.navItems.length).toBe(3);
    expect(component.portfolioLinks.length).toBe(2);
    expect(element.textContent).toContain('Insight');
    expect(element.textContent).toContain('Overview');
    expect(element.textContent).toContain('Channels');
    expect(element.textContent).toContain('API Connected');
  });

  it('toggles the collapsed state', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const component = fixture.componentInstance;

    expect(component.collapsed()).toBe(false);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(true);
    component.toggleCollapsed();
    expect(component.collapsed()).toBe(false);
  });

  it('emits a close request when navigation is triggered', () => {
    const fixture = TestBed.createComponent(SidebarComponent);
    const component = fixture.componentInstance;
    const emitSpy = jest.spyOn(component.requestClose, 'emit');

    component.handleNavClick();

    expect(emitSpy).toHaveBeenCalled();
  });
});
