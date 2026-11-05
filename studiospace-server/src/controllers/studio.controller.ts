
import { ObjectId } from "mongodb";
import type { Request, Response } from "express";
import { getDB } from "../config/db";

const collection = () => getDB().collection("studios");

// Safely extract studio ID from request params
const getStudioId = (req: Request): string | null => {
  const id = req.params.id;

  if (typeof id !== "string" || !ObjectId.isValid(id)) {
    return null;
  }

  return id;
};

// GET ALL STUDIOS
export const getStudios = async (_req: Request, res: Response) => {
  try {
    const studios = await collection()
      .find({})
      .sort({ createdAt: -1 })
      .toArray();

    res.status(200).json({
      success: true,
      data: studios,
    });
  } catch (error) {
    console.error("Get studios error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch studios",
    });
  }
};

// GET SINGLE STUDIO
export const getStudioById = async (req: Request, res: Response) => {
  try {
    const id = getStudioId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid studio ID",
      });
    }

    const studio = await collection().findOne({
      _id: new ObjectId(id),
    });

    if (!studio) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    res.status(200).json({
      success: true,
      data: studio,
    });
  } catch (error) {
    console.error("Get studio error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch studio",
    });
  }
};

// CREATE STUDIO
export const createStudio = async (req: Request, res: Response) => {
  try {
    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      amenities,
      description,
      hostName,
      hostEmail,
    } = req.body;

    if (
      !title ||
      !category ||
      hourlyRate == null ||
      maxCapacity == null ||
      !location ||
      !image ||
      !description ||
      !hostName ||
      !hostEmail
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required studio information",
      });
    }

    const studio = {
      title: String(title).trim(),
      category,
      hourlyRate: Number(hourlyRate),
      securityDeposit: Number(securityDeposit || 0),
      maxCapacity: Number(maxCapacity),
      location: String(location).trim(),
      image,
      amenities: Array.isArray(amenities) ? amenities : [],
      description,
      hostName,
      hostEmail: String(hostEmail).toLowerCase().trim(),
      rating: 0,
      reviewCount: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    if (
      !Number.isFinite(studio.hourlyRate) ||
      studio.hourlyRate < 0 ||
      !Number.isFinite(studio.maxCapacity) ||
      studio.maxCapacity < 1 ||
      !Number.isFinite(studio.securityDeposit) ||
      studio.securityDeposit < 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide valid numeric values",
      });
    }

    const result = await collection().insertOne(studio);

    res.status(201).json({
      success: true,
      message: "Studio created successfully",
      data: {
        ...studio,
        _id: result.insertedId,
      },
    });
  } catch (error) {
    console.error("Create studio error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create studio",
    });
  }
};

// UPDATE STUDIO
export const updateStudio = async (req: Request, res: Response) => {
  try {
    const id = getStudioId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid studio ID",
      });
    }

    const {
      title,
      category,
      hourlyRate,
      securityDeposit,
      maxCapacity,
      location,
      image,
      amenities,
      description,
    } = req.body;

    const updates: Record<string, unknown> = {
      updatedAt: new Date(),
    };

    if (title !== undefined) updates.title = String(title).trim();
    if (category !== undefined) updates.category = category;
    if (location !== undefined) updates.location = location;
    if (image !== undefined) updates.image = image;
    if (description !== undefined) updates.description = description;

    if (hourlyRate !== undefined) {
      const value = Number(hourlyRate);

      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid hourly rate",
        });
      }

      updates.hourlyRate = value;
    }

    if (securityDeposit !== undefined) {
      const value = Number(securityDeposit);

      if (!Number.isFinite(value) || value < 0) {
        return res.status(400).json({
          success: false,
          message: "Invalid security deposit",
        });
      }

      updates.securityDeposit = value;
    }

    if (maxCapacity !== undefined) {
      const value = Number(maxCapacity);

      if (!Number.isInteger(value) || value < 1) {
        return res.status(400).json({
          success: false,
          message: "Invalid maximum capacity",
        });
      }

      updates.maxCapacity = value;
    }

    if (amenities !== undefined) {
      if (!Array.isArray(amenities)) {
        return res.status(400).json({
          success: false,
          message: "Amenities must be an array",
        });
      }

      updates.amenities = amenities;
    }

    const result = await collection().updateOne(
      { _id: new ObjectId(id) },
      { $set: updates }
    );

    if (!result.matchedCount) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    const updatedStudio = await collection().findOne({
      _id: new ObjectId(id),
    });

    res.status(200).json({
      success: true,
      message: "Studio updated successfully",
      data: updatedStudio,
    });
  } catch (error) {
    console.error("Update studio error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update studio",
    });
  }
};

// DELETE STUDIO
export const deleteStudio = async (req: Request, res: Response) => {
  try {
    const id = getStudioId(req);

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Invalid studio ID",
      });
    }

    const result = await collection().deleteOne({
      _id: new ObjectId(id),
    });

    if (!result.deletedCount) {
      return res.status(404).json({
        success: false,
        message: "Studio not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Studio deleted successfully",
    });
  } catch (error) {
    console.error("Delete studio error:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete studio",
    });
  }
};
