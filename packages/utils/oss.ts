import OSS from 'ali-oss'
import dotent from 'dotenv'
dotent.config()
import qs from 'querystring'

const prefix = process.env.API_ENV === 'TEST' ? '/test/' : ''

const client = new OSS({
  region: process.env.OSS_REGION,
  accessKeyId: process.env.OSS_KEY_ID as string,
  accessKeySecret: process.env.OSS_KEY_SECRET as string,
  bucket: process.env.OSS_BUCKET,
  secure: true,
})

/**
 * 参考文档
 *  公共头：https://help.aliyun.com/document_detail/31955.htm
 *  存储类型区别：https://help.aliyun.com/document_detail/51374.htm
 *  putObject: https://help.aliyun.com/document_detail/31978.html
 * 备注
 *  设置公共头Date但OSS不会存储这个值
 */
interface PutParams {
  servePath: string
  serveName: string
  local: string | ArrayBuffer
  headers?: {
    'x-oss-storage-class'?: 'Standard' | 'IA' | 'Archive' | 'ColdArchive'
    'x-oss-object-acl'?:
      | 'default'
      | 'public-read'
      | 'private'
      | 'public-read-write'
    'x-oss-forbid-overwrite'?: 'false' | 'true'
    'x-oss-tagging'?: { [k: string]: string } | string
    'x-oss-meta-timestamp'?: number
  }
}
async function put({ servePath, serveName, local, headers = {} }: PutParams) {
  const defaultHeaders = {
    'x-oss-storage-class': 'Standard', // 标准存储
    'x-oss-object-acl': 'public-read', // 公共读
    'Content-Disposition': `inline; filename="${encodeURIComponent(
      serveName,
    )}"`,
    'x-oss-forbid-overwrite': 'false', // 允许覆盖
    'x-oss-meta-timestamp': Date.now(),
  }
  if (typeof headers['x-oss-tagging'] === 'object') {
    headers['x-oss-tagging'] = qs.stringify(headers['x-oss-tagging'])
  }

  const result = await client.put(prefix + servePath + serveName, local, {
    headers: {
      ...defaultHeaders,
      ...headers,
    },
  })
  return result
}

interface PullParams {
  servePath: string
  serveName: string
  type?: 'json' | 'text' | 'buff'
}
async function pull<T>({
  servePath,
  serveName,
  type = 'json',
}: PullParams): Promise<T> {
  const result = await client.get(servePath + serveName)
  if (type === 'json') {
    return JSON.parse(result.content.toString())
  } else if (type === 'text') {
    return result.content.toString()
  } else if (type === 'buff') {
    return result.content
  }
  return result.content
}
// 判断是否存在
// https://help.aliyun.com/document_detail/111392.html?spm=a2c4g.32074.0.0.36c2786c1TyRCb
// 修改元数据
// https://help.aliyun.com/document_detail/111412.html?spm=a2c4g.111392.0.0.996710cbNUg94A
// 拷贝文件：用不着拷贝，在写入文件时写入一个备份文件，写入失败报警
export const ossServer = {
  put,
  pull,
}
