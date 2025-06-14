import { Request, Response } from "express";
import Content from "../model/content.model.js";
import Tag from "../model/Tag.model.js";
import mongoose from "mongoose";
import Share from "../model/share.model.js";
import { pc } from "../util/pinecone.js";


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
      link: link,
      tags: tags,
      title: title,
      date: contentDoc.createdAt.toISOString(),
      contentType: contentType,
      userId: user._id.toString(),
    };

    console.log("Record to upsert:", JSON.stringify(record, null, 2));
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
export async function getAllContent(
  req: CustomRequest,
  res: Response
): Promise<void> {
  const user = req.user;
  try {
    const content = await Content.find({ userId: user._id })
      .populate("userId", "usernmae")
      .populate("tags", "title");
    res.status(200).json({
      message: "Your Content",
      success: true,
      data: content,
    });
    return;
  } catch (e) {
    console.log("getAllContent", e);
    res.status(500).json({
      message: "Server Error",
      success: false,
    });
    return;
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


