import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PhoneticChartComponent } from './phonetic-chart.component';

describe('PhoneticChartComponent', () => {
  let component: PhoneticChartComponent;
  let fixture: ComponentFixture<PhoneticChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PhoneticChartComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PhoneticChartComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
