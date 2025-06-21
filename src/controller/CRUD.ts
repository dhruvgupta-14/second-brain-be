import { Request, Response } from "express";
import Content from "../model/content.model.js";
import Tag from "../model/Tag.model.js";
import mongoose from "mongoose";
import Share from "../model/share.model.js";
import { pc } from "../util/pinecone.js";
import Note from "../model/note.model.js";
import Upload from "../model/upload.model.js";
// import {
//   deleteFromCloudinary,
//   uploadToCloudinary,
// } from "../util/cloudinary.js";
import { deleteLocalFile } from "../middleware/multer.js";
import { deleteFromAzure, uploadToAzure } from "../util/azure.js";

interface CustomRequest extends Request {
  user?: any;
}
function random(len: number): string {
  let randomStr = "4536765hjgdfuhdioh@DHGDTUKCfsd@4r";
  let ans = "";
  for (let i = 0; i < len; i++) {
    ans = ans + randomStr[Math.floor(Math.random() * randomStr.length)];
  }
  return ans;
}

export async function createContent(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const { title, link, contentType, tags } = req.body;
  const user = req.user;
  try {
    const tagsObjectId: mongoose.Types.ObjectId[] = [];
    if (tags && tags.length !== 0) {
      for (let i = 0; i < tags.length; i++) {
        let find = await Tag.findOne({ title: tags[i] });
        if (find) {
          tagsObjectId.push(find._id);
        } else {
          const tagDoc = await Tag.create({ title: tags[i] });
          tagsObjectId.push(tagDoc._id);
        }
      }
    }
    let contentDoc;
    if (tagsObjectId && tagsObjectId.length > 0) {
      contentDoc = await Content.create({
        title,
        link,
        tags: tagsObjectId,
        contentType,
        userId: user._id,
      });
    } else {
      contentDoc = await Content.create({
        title,
        link,
        contentType,
        userId: user._id,
      });
    }
    const populatedContent = await contentDoc.populate("tags", "title");
    const index = pc
      .Index(process.env.PINECONE_INDEX_NAME || "vector-content")
      .namespace(user._id.toString());
    const textForEmbedding = `This is a ${contentType} titled "${title}", related to topics like ${tags.join(
      ", "
    )}.`;
    const record = {
      id: contentDoc._id.toString(),
      text: textForEmbedding,
      category:"link",
      link: link,
      tags: tags,
      title: title,
      date: contentDoc.createdAt.toISOString(),
      contentType: contentType,
      userId: user._id.toString(),
    };
    await index.upsertRecords([record]);
    res.status(200).json({
      message: "Content Created",
      success: true,
      data: populatedContent,
    });
    return;
  } catch (e) {
    console.log("create content", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}

export async function createNote(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const { title, content, tags } = req.body;
  const user = req.user;

  try {
    const tagsObjectId: mongoose.Types.ObjectId[] = [];

    if (tags && tags.length > 0) {
      for (const tagTitle of tags) {
        let existingTag = await Tag.findOne({ title: tagTitle });
        if (existingTag) {
          tagsObjectId.push(existingTag._id);
        } else {
          const newTag = await Tag.create({ title: tagTitle });
          tagsObjectId.push(newTag._id);
        }
      }
    }

    const noteDoc = await Note.create({
      title,
      content,
      tags: tagsObjectId,
      userId: user._id,
    });

    const populatedNote = await noteDoc.populate("tags", "title");

    const index = pc
      .Index(process.env.PINECONE_INDEX_NAME || "vector-content")
      .namespace(user._id.toString());

    const textForEmbedding = `This is a text note titled "${title}", related to ${tags.join(
      ", "
    )}. Content: ${content.slice(0, 100)}`;
    const record = {
      id: noteDoc._id.toString(),
      text: textForEmbedding,
      category:"note",
      title,
      tags,
      date: noteDoc.createdAt.toISOString(),
      contentType: "note",
      userId: user._id.toString(),
    };

    await index.upsertRecords([record]);

    res.status(200).json({
      success: true,
      message: "Note created",
      data: populatedNote,
    });
  } catch (err) {
    console.error("createNote error:", err);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function uploadFile(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const user = req.user;
  const { title, tags } = req.body;

  try {
    if (!req.file) {
      res.status(400).json({ success: false, message: "No file uploaded" });
      return;
    }

    // Upload to Azure Blob Storage
    const uploadedUrl = await uploadToAzure(req.file.path); // Azure function
    await deleteLocalFile(req.file.path); // remove local file

    // Handle tags
    const tagObjectIds: mongoose.Types.ObjectId[] = [];
    const tagTitles: string[] = Array.isArray(tags)
      ? tags
      : tags?.split(",").map((tag: string) => tag.trim()) || [];

    for (let tagTitle of tagTitles) {
      let existing = await Tag.findOne({ title: tagTitle });
      if (existing) {
        tagObjectIds.push(existing._id);
      } else {
        const created = await Tag.create({ title: tagTitle });
        tagObjectIds.push(created._id);
      }
    }

    // Save document in MongoDB
    const uploadDoc = await Upload.create({
      title,
      link: uploadedUrl,
      tags: tagObjectIds,
      userId: user._id,
    });

    //  Pinecone Indexing
    const index = pc
      .Index(process.env.PINECONE_INDEX_NAME || "vector-content")
      .namespace(user._id.toString());

    const embeddingText = `Uploaded file titled "${title}" related to tags: ${tagTitles.join(
      ", "
    )}`;

    const record = {
      id: uploadDoc._id.toString(),
      text: embeddingText,
      category:"upload",
      link: uploadedUrl,
      tags: tagTitles,
      title,
      date: uploadDoc.createdAt.toISOString(),
      contentType: "upload",
      userId: user._id.toString(),
    };

    await index.upsertRecords([record]);

    res.status(200).json({
      success: true,
      message: "File uploaded and indexed successfully",
      data: uploadDoc,
    });
  } catch (e) {
    console.error("uploadFile error", e);
    if (req.file) await deleteLocalFile(req.file.path); // clean up
    res.status(500).json({ success: false, message: "Server Error" });
  }
}


export async function getAllContent(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const user = req.user;

  try {
    const [contents, notes, uploads] = await Promise.all([
      Content.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .populate("tags", "title"),
      Note.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .populate("tags", "title"),
      Upload.find({ userId: user._id })
        .sort({ createdAt: -1 })
        .populate("tags", "title"),
    ]);

    // Normalize into one unified format
    const formattedContents = contents.map((item) => ({
      _id: item._id,
      type: "link",
      title: item.title,
      tags: item.tags,
      createdAt: item.createdAt,
      link: item.link,
      contentType: item.contentType,
    }));

    const formattedNotes = notes.map((item) => ({
      _id: item._id,
      type: "note",
      contentType: "note",
      title: item.title,
      tags: item.tags,
      createdAt: item.createdAt,
      content: item.content,
    }));

    const formattedUploads = uploads.map((item) => ({
      _id: item._id,
      type: "upload",
      contentType: "upload",
      title: item.title,
      tags: item.tags,
      createdAt: item.createdAt,
      link: item.link,
    }));

    const combined = [
      ...formattedContents,
      ...formattedNotes,
      ...formattedUploads,
    ];

    // Sort combined content by createdAt (descending)
    combined.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    res.status(200).json({
      message: "Fetched all user content",
      success: true,
      data: combined,
    });
  } catch (e) {
    console.error("getAllContent error:", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
}

export async function deleteContent(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const user = req.user;
  const { contentId } = req.params;
  try {
    const content = await Content.findOne({ userId: user._id, _id: contentId });
    if (!content) {
      res.status(400).json({
        message: "No such Content Exist",
        success: true,
      });
      return;
    }
    await Content.deleteOne({
      userId: user._id,
      _id: contentId,
    });
    const index = pc
      .Index(process.env.PINECONE_INDEX_NAME || "vector-content")
      .namespace(user._id.toString());

    await index.deleteOne(contentId.toString());

    res.status(200).json({
      message: "Content Deleted",
      success: true,
    });
    return;
  } catch (e) {
    console.log("delete content", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}

export async function deleteNote(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const user = req.user;
  const { noteId } = req.params;

  try {
    const note = await Note.findOne({ userId: user._id, _id: noteId });

    if (!note) {
      res.status(404).json({
        message: "Note not found",
        success: false,
      });
      return;
    }

    await Note.deleteOne({ userId: user._id, _id: noteId });
    const index = pc
      .Index(process.env.PINECONE_INDEX_NAME || "vector-content")
      .namespace(user._id.toString());

    await index.deleteOne(noteId.toString());

    res.status(200).json({
      message: "Note deleted successfully",
      success: true,
    });
    return;
  } catch (error) {
    console.error("deleteNote error:", error);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
  }
}

export async function deleteUpload(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const user = req.user;
  const { uploadId } = req.params;

  try {
    const upload = await Upload.findOne({ _id: uploadId, userId: user._id });
    if (!upload) {
      res.status(404).json({ success: false, message: "Upload not found" });
      return;
    }

    await deleteFromAzure(upload.link);
    await Upload.deleteOne({ _id: uploadId, userId: user._id });
    const index = pc
      .Index(process.env.PINECONE_INDEX_NAME || "vector-content")
      .namespace(user._id.toString());

    await index.deleteOne(uploadId.toString());

    res.status(200).json({
      success: true,
      message: "Upload deleted successfully",
    });
  } catch (e) {
    console.error("deleteUpload error", e);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
}

export async function ShareLink(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const user = req.user;
  const { share } = req.body;
  try {
    const linkDoc = await Share.findOne({ userId: user._id });
    if (linkDoc) {
      if (share) {
        res.status(200).json({
          message: "Link is already sharable",
          success: true,
          data: linkDoc.link,
        });
        return;
      } else {
        await Share.deleteOne({ link: linkDoc.link, userId: user._id });
        res.status(200).json({
          message: "Your brain become Private",
          success: true,
        });
        return;
      }
    }
    if (share) {
      const hash = random(10);
      const linkDoc = await Share.create({
        link: hash,
        userId: user._id,
      });
      res.status(200).json({
        message: "You can share your brain",
        success: true,
        data: linkDoc.link,
      });
      return;
    } else {
      res.status(200).json({
        message: "No such link exist",
        success: true,
      });
      return;
    }
  } catch (e) {
    console.log("share link gen", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}

export async function getOtherBrain(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const hash = req.params.hash;
  try {
    const linkDoc = await Share.findOne({ link: hash });
    if (!linkDoc) {
      res.status(400).json({
        message: "No such Brain exist",
        success: false,
      });
      return;
    }
    const content = await Content.find({ userId: linkDoc.userId })
      .sort({ createdAt: -1 })
      .populate("userId", "username")
      .populate("tags", "title");
    res.status(200).json({
      message: "Success",
      success: true,
      data: content,
    });
    return;
  } catch (e) {
    console.log("share brain", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}

export async function SearchContent(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const user = req.user;
  const query = req.body.query;
  try {
    const index = pc
      .Index(process.env.PINECONE_INDEX_NAME || "vector-content")
      .namespace(user._id.toString());
    const results = await index.searchRecords({
      query: {
        topK: 4,
        inputs: { text: query },
      },
      rerank: {
        model: "bge-reranker-v2-m3",
        topN: 10,
        rankFields: ["text"],
      },
    });
    res.status(200).json({
      message: "Search Results",
      success: true,
      data: results.result,
    });
    return;
  } catch (e) {
    console.log("search content", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
  }
}
