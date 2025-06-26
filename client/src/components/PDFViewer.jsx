import React, { useState } from 'react';
import { Download, FileText, ExternalLink, AlertCircle } from 'lucide-react';
import Logger from '../utils/logger';

const PDFViewer = ({
    fileUrl,
    fileName = 'Document',
    fileSize = null,
    uploadDate = null,
    showDownload = true,
    height = 'h-96',
    className = ''
}) => {
    const [loadError, setLoadError] = useState(false);

    const handleDownload = () => {
        if (fileUrl) {
            window.open(fileUrl, '_blank');
        }
    };

    const handleIframeError = () => {
        setLoadError(true);
        Logger.warn('PDF preview failed for:', fileName);
    };

    const formatFileSize = (bytes) => {
        if (!bytes) return '';
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB'];
        const sizeIndex = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, sizeIndex)).toFixed(2)) + ' ' + sizes[sizeIndex];
    };

    const formatDate = (dateString) => {
        if (!dateString) return '';
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    if (!fileUrl) {
        return (
            <div className={`bg-gray-50 rounded-lg border border-dashed border-gray-300 p-8 text-center ${className}`}>
                <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-600 mb-2">No Document Available</h4>
                <p className="text-gray-500">No file has been uploaded yet.</p>
            </div>
        );
    }

    return (
        <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden ${className}`}>
            {/* Header */}
            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-red-100 rounded-lg flex items-center justify-center">
                            <FileText className="h-4 w-4 text-red-600" />
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-800">{fileName}</h4>
                            <div className="flex items-center space-x-2 text-xs text-gray-500">
                                {fileSize && <span>{formatFileSize(fileSize)}</span>}
                                {uploadDate && <span>• {formatDate(uploadDate)}</span>}
                            </div>
                        </div>
                    </div>

                    {showDownload && (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleDownload}
                                className="flex items-center space-x-1 px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-md hover:bg-indigo-700 transition-colors"
                                title="Download file"
                            >
                                <Download className="h-3 w-3" />
                                <span>Download</span>
                            </button>
                            <button
                                onClick={handleDownload}
                                className="p-1.5 text-gray-500 hover:text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
                                title="Open in new tab"
                            >
                                <ExternalLink className="h-3 w-3" />
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* PDF Viewer */}
            <div className={`w-full ${height}`}>
                {loadError ? (
                    <div className="h-full flex items-center justify-center bg-gray-50">
                        <div className="text-center max-w-sm">
                            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                            <h4 className="font-medium text-gray-800 mb-2">Preview Not Available</h4>
                            <p className="text-sm text-gray-600 mb-4">
                                This PDF cannot be previewed in the browser. This might be due to browser restrictions or file format.
                            </p>
                            <button
                                onClick={handleDownload}
                                className="inline-flex items-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                            >
                                <Download className="h-4 w-4" />
                                <span>Download to View</span>
                            </button>
                        </div>
                    </div>
                ) : (
                    <iframe
                        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=1&zoom=page-fit`}
                        className="w-full h-full border-0"
                        title={`Preview of ${fileName}`}
                        onError={handleIframeError}
                        onLoad={() => setLoadError(false)}
                    />
                )}
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500">
                        {loadError ?
                            'Preview unavailable - use download button to view file' :
                            'PDF preview - some features may be limited'
                        }
                    </p>
                    {!loadError && (
                        <button
                            onClick={handleDownload}
                            className="text-xs text-indigo-600 hover:text-indigo-700 underline"
                        >
                            Open full version
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
};

export default PDFViewer; 