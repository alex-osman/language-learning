import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MemoryPalaceComponent } from './memory-palace.component';

describe('MemoryPalaceComponent', () => {
  let component: MemoryPalaceComponent;
  let fixture: ComponentFixture<MemoryPalaceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MemoryPalaceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MemoryPalaceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
