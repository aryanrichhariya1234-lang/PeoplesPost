import { Post } from '../models/postModel.js';
import { User } from '../models/userModel.js';

export const storeMetaDataUser = async (req, res) => {
  const { url, public_id } = req.body;

  if (!url || !public_id) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const id = req.user.id;
  const image = await User.updateOne(
    { _id: id },
    {
      photo: url,
      public_id,
    }
  );

  res.status(201).json(image);
};

export const storeMetaDataTour = async (req, res) => {
  const { url, public_id } = req.body;

  if (!url || !public_id) {
    return res.status(400).json({ message: 'Missing fields' });
  }
  const id = req.params.id;
  const image = await Post.updateOne(
    { _id: id },
    {
      url,
      public_id,
    }
  );

  res.status(201).json(image);
};
