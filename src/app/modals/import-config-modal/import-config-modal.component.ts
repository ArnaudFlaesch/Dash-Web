import { ErrorHandlerService } from './../../services/error.handler.service';
import { Component } from '@angular/core';
import { MatDialogRef } from '@angular/material/dialog';
import { ConfigService } from './../../services/config.service/config.service';

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

  public selectFile(event: any) {
    if (event.target.files && event.target.files[0]) {
      this.fileToUpload = event.target.files[0];
      console.log(this.fileToUpload);
    }
  }

  public upload(): void {
    if (this.fileToUpload) {
      this.configService.importConfig(this.fileToUpload).subscribe({
        next: (response) => {
          if (response) {
            this.dialogRef.close();
          }
        },
        error: (error: Error) =>
          this.errorHandlerService.handleError(error.message, this.ERROR_IMPORT_CONFIGURATION)
      });
    }
  }
}
