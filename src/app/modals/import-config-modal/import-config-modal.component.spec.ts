import { ComponentFixture, TestBed } from "@angular/core/testing";
import { MatDialogRef } from "@angular/material/dialog";
import { ConfigService } from "@services/config.service";
import { ErrorHandlerService } from "@services/error-handler.service";
import { ImportConfigModalComponent } from "./import-config-modal.component";
import { HttpTestingController, provideHttpClientTesting } from "@angular/common/http/testing";
import { provideHttpClient } from "@angular/common/http";
import { vi } from "vitest";
import { environment } from "@environments/environment";

describe("ImportConfigModalComponent", () => {
  let component: ImportConfigModalComponent;
  let fixture: ComponentFixture<ImportConfigModalComponent>;
  let httpTestingController: HttpTestingController;
  let closeSpy: ReturnType<typeof vi.fn>;

  const importUrl = `${environment.backend_url}/dashConfig/import`;

  beforeEach(async () => {
    closeSpy = vi.fn();
    await TestBed.configureTestingModule({
      providers: [
        ConfigService,
        ErrorHandlerService,
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: MatDialogRef, useValue: { close: closeSpy } }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(ImportConfigModalComponent);
    component = fixture.componentInstance;
    httpTestingController = TestBed.inject(HttpTestingController);
    await fixture.whenStable();
  });

  afterEach(() => {
    httpTestingController.verify();
  });

  function getElement<T extends HTMLElement>(selector: string): T {
    return (fixture.nativeElement as HTMLElement).querySelector(selector) as T;
  }

  /** Selects the files in the file input, as the browser does. */
  async function selectFiles(files: File[]): Promise<void> {
    const input = getElement<HTMLInputElement>("#file");
    Object.defineProperty(input, "files", { value: files, configurable: true });
    input.dispatchEvent(new Event("change"));
    await fixture.whenStable();
  }

  it("Should create the component", () => {
    expect(component).toBeTruthy();
  });

  it("Should display the modal with the upload button disabled", () => {
    expect(getElement("h1").textContent?.trim()).toEqual(component.labels.importConfig);
    expect(getElement("#file").getAttribute("aria-label")).toEqual(
      component.labels.selectConfigFile
    );
    expect(getElement("#close-import-config-modal").textContent?.trim()).toEqual(
      component.labels.cancel
    );
    const uploadButton = getElement<HTMLButtonElement>("#upload-file-button");
    expect(uploadButton.textContent?.trim()).toEqual(component.labels.upload);
    expect(uploadButton.disabled).toBe(true);
  });

  it("Should upload the selected file then close the modal", async () => {
    const file = new File(["{}"], "dashboardConfig.json");
    await selectFiles([file]);
    expect(component.fileToUpload()).toEqual(file);
    const uploadButton = getElement<HTMLButtonElement>("#upload-file-button");
    expect(uploadButton.disabled).toBe(false);

    uploadButton.click();
    const request = httpTestingController.expectOne(importUrl);
    expect((request.request.body as FormData).get("file")).toEqual(file);
    request.flush(true);
    expect(closeSpy).toHaveBeenCalled();
  });

  it("Should disable the upload button when the file selection is cleared", async () => {
    await selectFiles([new File(["{}"], "dashboardConfig.json")]);
    await selectFiles([]);
    expect(component.fileToUpload()).toBeNull();
    expect(getElement<HTMLButtonElement>("#upload-file-button").disabled).toBe(true);
  });

  it("Should not send a request when no file is selected", () => {
    component.upload();
    expect(httpTestingController.match(importUrl)).toHaveLength(0);
  });

  it("Should display an error and keep the modal open when the import fails", async () => {
    const handleErrorSpy = vi.spyOn(TestBed.inject(ErrorHandlerService), "handleError");
    await selectFiles([new File(["{}"], "dashboardConfig.json")]);
    getElement<HTMLButtonElement>("#upload-file-button").click();
    httpTestingController
      .expectOne(importUrl)
      .flush(null, { status: 500, statusText: "Server error" });
    expect(handleErrorSpy).toHaveBeenCalledWith(
      expect.objectContaining({ status: 500 }),
      "Erreur lors de l'import de la configuration."
    );
    expect(closeSpy).not.toHaveBeenCalled();
  });
});
