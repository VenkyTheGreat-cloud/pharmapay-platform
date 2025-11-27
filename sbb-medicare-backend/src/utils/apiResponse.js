// Utility for consistent API responses

const successResponse = (data, message = null) => {
    const response = {
        success: true,
        data
    };
    if (message) {
        response.message = message;
    }
    return response;
};

const errorResponse = (code, message) => {
    return {
        success: false,
        error: {
            code,
            message
        }
    };
};

const paginatedResponse = (data, pagination) => {
    return {
        success: true,
        data: {
            ...data,
            pagination
        }
    };
};

module.exports = {
    successResponse,
    errorResponse,
    paginatedResponse
};

