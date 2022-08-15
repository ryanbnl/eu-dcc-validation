import { Component, OnInit, ViewChild } from '@angular/core';
import { FlatTreeControl } from '@angular/cdk/tree';
import { MatTreeFlatDataSource, MatTreeFlattener } from '@angular/material/tree';
import * as _ from 'lodash';
import { AppStore } from '../../stores/app.store';
import { TreeNode, FlatNode } from '../../interfaces/tree.interface'
import { IQRCode, TestResultEnum, Analytics } from '../../interfaces/model.interface';
import { FormControl } from '@angular/forms';

interface FilterOptions {
  value: string;
  label: string;
}

@Component({
  selector: 'app-qrtree',
  templateUrl: './qrtree.component.html',
  styleUrls: ['./qrtree.component.css']
})
export class QRTreeComponent implements OnInit {

  selected: IQRCode | null = null;

  filterControl: FormControl = new FormControl("all");

  filterOptions: FilterOptions[] = [
    {value: 'all', label: 'All'},
    {value: 'valid', label: 'Valid'},
    {value: 'invalid', label: 'Invalid'},
    {value: 'error', label: 'Error'}
  ];

  cachedData: any = null;

  constructor(private store: AppStore) {
    this.store.getData().subscribe((data: IQRCode[]) => {
      this.dataSource.data = this._group(data);
      this.treeControl.expandAll();
      this.cachedData = data;
    });
    this.store.getSelected().subscribe((selected: IQRCode | null) => {
      this.selected = selected;
    });
  }

  ngOnInit(): void {
    this.filterControl.valueChanges.subscribe(v => {
      if(this.cachedData === null) {
        console.log("no data cache :(")
        return;
      }
      this.dataSource.data = this._group(this.cachedData);
    });
  }

  ngAfterViewInit(): void {
    this.treeControl.expandAll();
  }

  private _group(data: IQRCode[]) {
    // apply filterControl to raw data
    var filteredData = null;
    if(this.filterControl.value === 'valid') {
      filteredData = _.filter(data, (d: IQRCode) => d.result === TestResultEnum.Valid);
    } else if (this.filterControl.value === 'invalid'){
      filteredData = _.filter(data, (d: IQRCode) => d.result === TestResultEnum.Invalid);
    } else if (this.filterControl.value === 'error'){
      filteredData = _.filter(data, (d: IQRCode) => d.result === TestResultEnum.Error);
    } else {
      filteredData = data;
    }

    let grouped = _.groupBy(filteredData, 'country');
    let nodes: any = Object.keys(grouped)
      .map((key, index) => {
        return { title: key, children: grouped[key], value: 'FF' }
      });

    // sort
    nodes = _.sortBy(nodes, ['title']);

    return nodes;
  }

  private _transformer = (node: TreeNode, level: number) => {
    return {
      expandable: !!node.children && node.children.length > 0,
      title: node.title,
      level: level,
    };
  };

  treeControl = new FlatTreeControl<FlatNode>(
    node => node.level,
    node => node.expandable,
  );

  treeFlattener = new MatTreeFlattener(
    this._transformer,
    node => node.level,
    node => node.expandable,
    node => node.children,
  );

  dataSource = new MatTreeFlatDataSource(this.treeControl, this.treeFlattener);

  hasChild = (_: number, node: FlatNode) => node.expandable;

  public select(item: any) {
    const qr = this.store.getData().value.find(i => {
      return i.title === item.title;
    });
    if (!!qr) {
      this.store.setSelected(qr);
    }
  }

  icon(id: string) {
    const item = this.store.find(id);
    switch (item?.result) {
      case TestResultEnum.Valid:
        return 'done';
      case TestResultEnum.Invalid:
        return 'report_problem'
      case TestResultEnum.Error:
        return 'error'
      default:
        return 'qr_code'
    }
  }
}
