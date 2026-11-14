const Location = require('../models/Location');
const { sendSuccess, sendError } = require('../utils/apiResponse');

/**
 * @desc    Get all active campus locations
 * @route   GET /api/locations
 * @access  Private (Authenticated)
 */
const getAllLocations = async (req, res, next) => {
  try {
    const { buildingName, roomType, search } = req.query;
    const query = { isActive: true };

    if (buildingName) {
      query.buildingName = new RegExp(buildingName, 'i');
    }

    if (roomType) {
      query.roomType = roomType;
    }

    if (search) {
      query.$or = [
        { qrCode: new RegExp(search, 'i') },
        { buildingName: new RegExp(search, 'i') },
        { roomNumber: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
      ];
    }

    const locations = await Location.find(query)
      .populate('assignedFaculty', 'fullName email')
      .sort({ buildingName: 1, roomNumber: 1 });

    return sendSuccess(res, 'Locations retrieved successfully', {
      total: locations.length,
      locations,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get single location by ID
 * @route   GET /api/locations/:id
 * @access  Private (Authenticated)
 */
const getLocationById = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return sendError(res, 'Campus location not found', 404);
    }

    return sendSuccess(res, 'Location retrieved successfully', { location });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Identify campus location by QR code identifier (e.g., PU-ENGG-LH204)
 * @route   GET /api/locations/qr/:code
 * @access  Private (Authenticated)
 */
const getLocationByQrCode = async (req, res, next) => {
  try {
    const qrCode = req.params.code.toUpperCase().trim();
    const location = await Location.findOne({ qrCode, isActive: true });

    if (!location) {
      return sendError(res, `No active campus location found for QR code: ${qrCode}`, 404);
    }

    return sendSuccess(res, 'Location identified successfully from QR scan', { location });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create a new campus location & QR record
 * @route   POST /api/locations
 * @access  Private (Admin only)
 */
const createLocation = async (req, res, next) => {
  try {
    const {
      qrCode,
      buildingName,
      block,
      floor,
      roomNumber,
      roomType = 'Classroom',
      description = '',
      facilities = [],
    } = req.body;

    if (!qrCode || !buildingName || !block || !floor || !roomNumber) {
      return sendError(
        res,
        'Please provide all required fields: qrCode, buildingName, block, floor, and roomNumber',
        400
      );
    }

    const formattedQrCode = qrCode.toUpperCase().trim();

    // Check for existing QR code
    const existing = await Location.findOne({ qrCode: formattedQrCode });
    if (existing) {
      return sendError(res, `Location with QR code '${formattedQrCode}' already exists`, 400);
    }

    const location = await Location.create({
      qrCode: formattedQrCode,
      buildingName: buildingName.trim(),
      block: block.trim(),
      floor: floor.trim(),
      roomNumber: roomNumber.trim(),
      roomType,
      description: description.trim(),
      facilities: Array.isArray(facilities) ? facilities : [facilities],
    });

    return sendSuccess(res, 'Campus location created successfully', { location }, 201);
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update campus location details
 * @route   PUT /api/locations/:id
 * @access  Private (Admin only)
 */
const updateLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return sendError(res, 'Location not found', 404);
    }

    const {
      buildingName,
      block,
      floor,
      roomNumber,
      roomType,
      description,
      facilities,
      isActive,
      approvalAuthority,
      assignedFaculty,
    } = req.body;

    if (buildingName) location.buildingName = buildingName.trim();
    if (block) location.block = block.trim();
    if (floor) location.floor = floor.trim();
    if (roomNumber) location.roomNumber = roomNumber.trim();
    if (roomType) location.roomType = roomType;
    if (description !== undefined) location.description = description.trim();
    if (facilities) location.facilities = Array.isArray(facilities) ? facilities : [facilities];
    if (isActive !== undefined) location.isActive = isActive;
    if (approvalAuthority && ['admin', 'faculty'].includes(approvalAuthority)) {
      location.approvalAuthority = approvalAuthority;
    }
    if (assignedFaculty !== undefined) {
      location.assignedFaculty = assignedFaculty || null;
    }

    const updatedLocation = await location.save();

    return sendSuccess(res, 'Location updated successfully', { location: updatedLocation });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Deactivate a campus location (soft delete)
 * @route   DELETE /api/locations/:id
 * @access  Private (Admin only)
 */
const deleteLocation = async (req, res, next) => {
  try {
    const location = await Location.findById(req.params.id);

    if (!location) {
      return sendError(res, 'Location not found', 404);
    }

    location.isActive = false;
    await location.save();

    return sendSuccess(res, 'Campus location deactivated successfully');
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllLocations,
  getLocationById,
  getLocationByQrCode,
  createLocation,
  updateLocation,
  deleteLocation,
};

