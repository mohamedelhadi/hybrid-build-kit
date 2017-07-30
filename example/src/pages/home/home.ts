import { Component } from '@angular/core';
import { NavController } from 'ionic-angular';

import { Configuration } from "../../app/config/env.config";
import { Api } from "../../app/api";

@Component({
    selector: 'page-home',
    templateUrl: 'home.html'
})
export class HomePage {
    constructor(public navCtrl: NavController, public config: Configuration, private api: Api) {
    }
    public ionViewDidLoad() {
        this.api.get('data').subscribe(data => console.log(data));
    }
}
