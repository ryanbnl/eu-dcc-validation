import { Component, OnInit } from '@angular/core';
import { IQRCode, TestResultEnum } from '../../interfaces/model.interface';
import { AppStore } from '../../stores/app.store';
import { MatMenuModule } from '@angular/material/menu';

@Component({
  selector: 'app-test-result',
  templateUrl: './test-result.component.html',
  styleUrls: ['./test-result.component.css']
})
export class TestResultComponent implements OnInit {

  model = { reason: '' }
  item: IQRCode | null;

  requireDescription = false;

  invalidReasons: string[] = [
    'Invalid - partial vaccination',
    'Invalid - fully vaccinated booster required',
    'Invalid - vaccine or test not supported',
    'Invalid - unknown, app provides no details'
  ];

  errorReasons: string[] = [
    'Error - scanner does not recognise image as QR code',
    'Error - scanner cannot parse the QR code',
    'Error - signature check failed',
    'Error - unknown, app provides no details'
  ];

  constructor(private store: AppStore) {
    this.item = null;
    this.store.getSelected().subscribe((selected: IQRCode | null) => {
      this.item = selected;
      if (!!selected) {
        this.sync(selected);
      }
      console.log('TestResultComponent: Selected: ', this.item);
    });
  }

  ngOnInit(): void {
  }

  /**
   * Mark the QR code as valid.
   */
  valid(): void {
    console.log('Log success.');
    this.report(TestResultEnum.Valid);
  }

  /**
   * Mark the QR code as invalid.
   */
  invalid(reason:string): void {
    console.log('Log warning.', this.model);
    this.report(TestResultEnum.Invalid, reason);
  }

  /**
   * Report an error during the scanning process.
   */
  error(reason: string): void {
    console.log('Log error.', this.model);
    this.report(TestResultEnum.Error, reason);
  }

  /**
   * Report and submit the validation outcome.
   * @param result 
   */
  report(result: TestResultEnum, reason?: string) {
    const id = this.store.getSelected().value?.id
    if (!!id) {
      this.store.capture({ file: id, result: result, comment: reason || '' })
      this.broadcast();
      this.cleanup();
      this.store.next();
    } else {
      // TODO: Handle error.
      this.store.setMessage('ERROR: No QRcode selected. See your console.')
      console.error('No QRcode selected.');
    }
    this.requireDescription = false;
  }

  /**
   * Notify the result is submitted.
   */
  private broadcast() {
    this.store.setMessage('Responce captured.');
  }

  /**
   * Clean up the form.
   */
  private cleanup() {
    this.model = { reason: '' };
  }

  /**
   * Sync the form with the selected QR code. Display a previously submitted reason, if any. 
   */
  private sync(item: IQRCode | null) {
    this.cleanup();
    if (!item) {    
      return;
    }
    const results = this.store.getResults().findEntry(item.id);
    if (!!results && results.length > 0) {
      this.model.reason = results[0].comment;
    }
  }
}
