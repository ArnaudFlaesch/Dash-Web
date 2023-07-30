import { ErrorHandlerService } from './../../services/error.handler.service';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfigService } from './../../services/config.service/config.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-import-config-modal',
  templateUrl: './import-config-modal.component.html',
  styleUrls: ['./import-config-modal.component.scss']
})
export class ImportConfigModalComponent {
  public fileToUpload: File | null = null;
  private ERROR_IMPORT_CONFIGURATION = "Erreur lors de l'import de la configuration.";

  constructor(
    private configService: ConfigService,
    private errorHandlerService: ErrorHandlerService,
    public dialogRef: MatDialogRef<ImportConfigModalComponent>
  ) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public selectFile(event: any): void {
    if (event.target.files?.[0]) {
      this.fileToUpload = event.target.files[0];
    }
  }

  public upload(): void {
    if (this.fileToUpload) {
      this.configService.importConfig(this.fileToUpload).subscribe({
        error: (error: HttpErrorResponse) =>
          this.errorHandlerService.handleError(error, this.ERROR_IMPORT_CONFIGURATION),
        complete: () => {
          this.dialogRef.close();
          window.location.reload();
        }
      });
    }
  }
}
