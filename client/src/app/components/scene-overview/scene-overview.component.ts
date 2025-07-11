import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-scene-overview',
  imports: [],
  templateUrl: './scene-overview.component.html',
  styleUrl: './scene-overview.component.scss',
})
export class SceneOverviewComponent implements OnInit {
  sceneId: string = '';

  constructor(private route: ActivatedRoute) {}

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.sceneId = params['sceneId'] || '';
    });
  }
}
