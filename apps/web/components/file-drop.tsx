"use client";

import { useRef, useState } from "react";

const accept =
  ".csv,.tsv,.json,.jsonl,.parquet,.arrow,.ipc,.avro,.sqlite,.db,application/octet-stream";

type FileDropProps = {
  disabled?: boolean;
  file: File | null;
  onFileChange: (file: File | null) => void;
};

export function FileDrop({ disabled, file, onFileChange }: FileDropProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);

  function handleFiles(fileList: FileList | null) {
    const next = fileList?.[0] ?? null;
    onFileChange(next);
  }

  return (
    <div
      className={`file-drop ${isDragging ? "file-drop-active" : ""} ${disabled ? "file-drop-disabled" : ""}`}
      onDragEnter={(event) => {
        event.preventDefault();
        if (!disabled) {
          setIsDragging(true);
        }
      }}
      onDragLeave={(event) => {
        event.preventDefault();
        setIsDragging(false);
      }}
      onDragOver={(event) => event.preventDefault()}
      onDrop={(event) => {
        event.preventDefault();
        setIsDragging(false);
        if (!disabled) {
          handleFiles(event.dataTransfer.files);
        }
      }}
      onClick={() => {
        if (!disabled) {
          inputRef.current?.click();
        }
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          inputRef.current?.click();
        }
      }}
      role="presentation"
    >
      <input
        ref={inputRef}
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
        type="file"
      />
      <p className="file-drop-title">
        {file ? file.name : "Drop a dataset here or click to browse"}
      </p>
      <p className="file-drop-hint">
        CSV, TSV, JSON, JSONL, Parquet, Arrow IPC, Avro, SQLite — up to 50&nbsp;MB
      </p>
      {file ? (
        <button
          className="file-drop-clear"
          disabled={disabled}
          onClick={(event) => {
            event.stopPropagation();
            onFileChange(null);
            if (inputRef.current) {
              inputRef.current.value = "";
            }
          }}
          type="button"
        >
          Clear file
        </button>
      ) : (
        <button
          className="file-drop-browse"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          type="button"
        >
          Browse files
        </button>
      )}
    </div>
  );
}
