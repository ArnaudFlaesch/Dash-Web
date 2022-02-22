import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-weather-widget',
  templateUrl: './weather-widget.component.html',
  styleUrls: ['./weather-widget.component.scss']
})
export class WeatherWidgetComponent implements OnInit {
  constructor() {}

  ngOnInit(): void {}

  public refreshWidget() {
    console.log('refreshWidget');
  }
}
