import React from 'react';
import { useParams } from 'react-router-dom';
import NewsPostExperience from '../components/NewsPostExperience';

export default function NewsPostPage() {
  const { id } = useParams();
  if (!id) return null;
  return <NewsPostExperience postId={id} />;
}
