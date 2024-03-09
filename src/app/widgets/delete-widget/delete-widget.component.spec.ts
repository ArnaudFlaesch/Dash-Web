import { TestBed } from '@angular/core/testing';
import { DeleteWidgetComponent } from './delete-widget.component';

describe('DeleteWidgetComponent', () => {
  let component: DeleteWidgetComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [],
      providers: []
    }).compileComponents();

    const fixture = TestBed.createComponent(DeleteWidgetComponent);
    component = fixture.componentInstance;
  });

  it('Should create the component', () => {
    expect(component).toBeTruthy();
  });
});
