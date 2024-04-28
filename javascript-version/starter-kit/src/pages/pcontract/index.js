// ** React Imports
import { useState, useEffect, forwardRef, Fragment, useMemo } from 'react'
import { useForm, Controller, useWatch } from 'react-hook-form'
import * as yup from 'yup'
import { yupResolver } from '@hookform/resolvers/yup'

import { deleteFunction, fetchData, updateFunction, getByid, FetchContract } from 'src/APIs/contractPersonal'
import { formatDate, getShipsPerClint } from 'src/APIs/utilFunction'
import TableHeader from './TableHeader/index'
import axios from 'axios'

import DatePicker from 'react-datepicker'

import DatePickerWrapper from 'src/@core/styles/libs/react-datepicker'

// ** Next Import
import Link from 'next/link'

// ** MUI Imports
import Fade from '@mui/material/Fade'

import Box from '@mui/material/Box'
import Grid from '@mui/material/Grid'
import Card from '@mui/material/Card'
import Tooltip from '@mui/material/Tooltip'
import { styled } from '@mui/material/styles'
import MenuItem from '@mui/material/MenuItem'
import CardHeader from '@mui/material/CardHeader'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import CardContent from '@mui/material/CardContent'
import { DataGrid, gridColumnsTotalWidthSelector } from '@mui/x-data-grid'
import Button from '@mui/material/Button'

import Dialog from '@mui/material/Dialog'
import DialogContent from '@mui/material/DialogContent'

import CustomAutocomplete from 'src/@core/components/mui/autocomplete'

const Transition = forwardRef(function Transition(props, ref) {
  return <Fade ref={ref} {...props} />
})
const CustomCloseButton = styled(IconButton)(({ theme }) => ({
  top: 0,
  right: 0,
  color: 'grey.500',
  position: 'absolute',
  boxShadow: theme.shadows[2],
  transform: 'translate(10px, -10px)',
  borderRadius: theme.shape.borderRadius,
  backgroundColor: `${theme.palette.background.paper} !important`,
  transition: 'transform 0.25s ease-in-out, box-shadow 0.25s ease-in-out',
  '&:hover': {
    transform: 'translate(7px, -5px)'
  }
}))

// ** Icon Imports
import Icon from 'src/@core/components/icon'

// ** Third Party Imports
import format from 'date-fns/format'

// ** Store & Actions Imports
import { useSelector } from 'react-redux'

// ** Utils Import
import { getInitials } from 'src/@core/utils/get-initials'

// ** Custom Components Imports
import CustomChip from 'src/@core/components/mui/chip'
import CustomAvatar from 'src/@core/components/mui/avatar'
import OptionsMenu from 'src/@core/components/option-menu'
import CustomTextField from 'src/@core/components/mui/text-field'

// ** Styled Components
import DeleteDialog from './dialogs/deleteDialog'
import { secondsInDay } from 'date-fns'

// ** Styled component for the link in the dataTable
const LinkStyled = styled(Link)(({ theme }) => ({
  textDecoration: 'none',
  fontSize: theme.typography.body1.fontSize,
  color: `${theme.palette.primary.main} !important`
}))

// ** renders client column
const renderClient = row => {
  if (row.avatar.length) {
    return <CustomAvatar src={row.avatar} sx={{ mr: 2.5, width: 38, height: 38 }} />
  } else {
    return (
      <CustomAvatar
        skin='light'
        color={row.avatarColor || 'primary'}
        sx={{ mr: 2.5, width: 38, height: 38, fontWeight: 500, fontSize: theme => theme.typography.body1.fontSize }}
      >
        {getInitials(row.name || 'John Doe')}
      </CustomAvatar>
    )
  }
}

const defaultColumns = [
  {
    flex: 0.25,
    field: 'SDate',
    minWidth: 150,
    headerName: 'Début de Contrat'
  },
  {
    flex: 0.25,
    field: 'EDate',
    minWidth: 150,
    headerName: 'Fin de Contrat'
  },

  {
    flex: 0.25,
    field: 'Coqu',
    minWidth: 20,
    headerName: 'coqu'
  },

  {
    flex: 0.25,
    field: 'motor',
    minWidth: 20,
    headerName: 'Moteur'
  },
  {
    flex: 0.25,
    field: 'netAmount',
    minWidth: 20,
    headerName: 'Montant Net'
  },
  {
    flex: 0.25,
    field: 'totalAmount',
    minWidth: 20,
    headerName: 'Montant Total'
  },
  {
    flex: 0.25,
    field: 'clientName',
    minWidth: 20,
    headerName: 'client'
  },
  {
    flex: 0.25,
    field: 'shipName',
    minWidth: 20,
    headerName: 'Ship'
  }
  // {
  //   flex: 0.25,
  //   field: 'City',
  //   minWidth: 100,
  //   headerName: 'Ville',
  //   renderCell: ({ row }) => <Typography sx={{ color: 'text.secondary' }}>{row.City}</Typography>
  // }
]
/* eslint-disable */
const CustomInput = forwardRef((props, ref) => {
  const startDate = props.start !== null ? props.start : ''
  // const startDate = props.start !== null ? format(props.start, 'MM/dd/yyyy') : ''
  // const endDate = props.end !== null ? ` - ${format(props.end, 'MM/dd/yyyy')}` : null
  const value = `${startDate}`
  props.start === null && props.dates.length && props.setDates ? props.setDates([]) : null
  const updatedProps = { ...props }
  delete updatedProps.setDates
  return <CustomTextField fullWidth inputRef={ref} {...updatedProps} label={props.label || ''} value={value} />
})

/* eslint-enable */
const InvoiceList = ({ apiData, clients, ships }) => {
  ///****DATA*****////
console.log("eeeee",clients)
  const clientsOption = clients.map(client => ({
    label: client.Fname + ' ' + client.Lname,
    value: client.id
  }))


  const schema = useMemo(
    () =>
      yup.object({
        client: yup.mixed().required(),
        // ship: yup.mixed().required(),
        motor: yup.number().required().positive().integer(),
        Coqu: yup.number().required().positive().integer(),
        SDate: yup.date().required(),
        EDate: yup.date().required()
      }),
    []
  )
  const {
    control,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {},
    mode: 'onChange',
    resolver: yupResolver(schema)
  })

  console.log(errors)

  const watchClient = useWatch({ name: 'client', control })
  // console.log('miawe', watchClient?.value)

  const shipsOption = ships
    .filter(ship => {
      return ship.ownerId === watchClient?.value && ship.ownerType === 'person'
    })
    .map(filteredShip => {
      return { label: filteredShip.name, value: filteredShip.id }
    })
  console.log('ships perclient', shipsOption)

  const [filteredData, setFilteredData] = useState(apiData)

  /// delete
  const [showDelete, setShowDelete] = useState(false)
  const [showUpdate, setShowUpdate] = useState(false)
  const [selectedId, setSelectedID] = useState(-1)
  const [selectedContract, setSelectedContract] = useState(null)
  const [SelectedClientShips, setSelectedClientShips] = useState([])

  // Gestion de la suppression
  const handleClickDelete = row => {
    setShowDelete(true)
    setSelectedID(row.id)
  }
  const handleClickUpdate = async row => {
    const contract = await getByid(row.id)
    console.log('hi contract ', contract)
    reset({
      ...contract,
      SDate: row.SDate ? new Date(row.SDate).toISOString().split('T')[0] : '',
      EDate: row.EDate ? new Date(row.EDate).toISOString().split('T')[0] : '',
      client: clientsOption.find(option => option.value === contract.client.id) ?? null,
      ship: shipsOption.find(option => option.value === contract.ShipId) ?? null
    })
    setSelectedContract(contract)
    const clientShips = await getShipsPerClint(contract.ClientId)
    setSelectedClientShips(clientShips)
    setShowUpdate(true)
  }

  const DeletePersonnalContract = async id => {
    const deleted = await deleteFunction(id)
    if (deleted) {
      const newData = await FetchContract()

      setShowDelete(false)
      setFilteredData(newData)
    }
  }

  const updateCampany = async (id, data) => {
    const update = await updateFunction(id, data)
    if (update) {
      const newData = await FetchContract()
      setFilteredData(newData)
      setShowDelete(false)
    }
  }
  const onSubmit = data => {
    data = {
      ...data,
      id: selectedContract.id,
      motor: parseFloat(data.motor),
      Coqu: parseFloat(data.Coqu),
      totalAmount: parseFloat(data.Coqu) + parseFloat(data.motor) + 10,
      netAmount: parseFloat(data.Coqu) + parseFloat(data.motor),
      SDate: formatDate(selectedContract.SDate),
      EDate: formatDate(selectedContract.EDate),
      ClientId: selectedContract.ClientId,
      ShipId: selectedContract.ShipId
    }

    setShowUpdate(false)

    updateCampany(selectedContract?.id, data)

    reset()
  }

  // ** State
  const [dates, setDates] = useState([])
  const [value, setValue] = useState('')
  const [statusValue, setStatusValue] = useState('')
  const [endDateRange, setEndDateRange] = useState(null)
  const [selectedRows, setSelectedRows] = useState([])
  const [startDateRange, setStartDateRange] = useState(null)
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 5 })
  const [city, setCity] = useState(null)
  const [cp, setCp] = useState(null)

  const handleFilter = val => {
    setValue(val)
  }

  // const filteredRows = filteredData.filter(row => row.netAmount.toLowerCase().includes(value.toLowerCase()))
  const filteredRows = filteredData.filter(
    row =>
      // row.SDate.toLowerCase().includes(value.toLowerCase()) ||
      row.netAmount.toString().toLowerCase().includes(value.toString().toLowerCase()) ||
      row.shipName.toString().toLowerCase().includes(value.toString().toLowerCase()) ||
      row.clientName.toString().toLowerCase().includes(value.toString().toLowerCase())
  )

  const handleStatusValue = e => {
    setStatusValue(e.target.value)
  }

  const handleOnChangeRange = dates => {
    const [start, end] = dates
    if (start !== null && end !== null) {
      setDates(dates)
    }
    setStartDateRange(start)
    setEndDateRange(end)
  }

  const columns = [
    ...defaultColumns,
    {
      flex: 0.1,
      minWidth: 140,
      sortable: false,
      field: 'actions',
      headerName: 'Actions',
      renderCell: ({ row }) => (
        <>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <OptionsMenu
              menuProps={{ sx: { '& .MuiMenuItem-root svg': { mr: 2 } } }}
              iconButtonProps={{ size: 'small', sx: { color: 'text.secondary' } }}
              options={[
                {
                  text: 'Supprimer',
                  icon: <Icon icon='tabler:trash' fontSize={20} />,
                  value: 'delete',
                  menuItemProps: {
                    onClick: () => {
                      handleClickDelete(row)
                    }
                  }
                },
                {
                  text: 'Modifier',
                  icon: <Icon icon='tabler:edit' fontSize={20} />,
                  value: 'Edit',
                  menuItemProps: {
                    onClick: () => {
                      handleClickUpdate(row)
                    }
                  }
                }
              ]}
            />
          </Box>
        </>
      )
    }
  ]

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12} sx={{ pt: theme => `${theme.spacing(8)} !important` }}>
          <Typography variant='h6'>Gestion des Contrats Personnels</Typography>
        </Grid>
        <Grid item xs={12}>
          <DatePickerWrapper>
            <Grid container spacing={6}>
              <Grid item xs={12}>
                <Card>
                  <TableHeader value={value} selectedRows={selectedRows} handleFilter={handleFilter} />
                  <DataGrid
                    autoHeight
                    pagination
                    rowHeight={62}
                    rows={filteredRows}
                    columns={columns}
                    disableRowSelectionOnClick
                    pageSizeOptions={[5, 15, 25]}
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    onRowSelectionModelChange={rows => setSelectedRows(rows)}
                  />

                  {/* deleteDialog */}
                  <DeleteDialog
                    open={showDelete}
                    onClose={() => setShowDelete(false)}
                    onConfirm={DeletePersonnalContract}
                    selectedId={selectedId}
                  />
                  {/* updateDialog */}
                  <Dialog
                    fullWidth
                    open={showUpdate}
                    maxWidth='sm'
                    scroll='body'
                    onClose={() => {
                      setShowUpdate(false)
                      setSelectedContract(null)
                      reset()
                    }}
                    TransitionComponent={Transition}
                    onBackdropClick={() => {
                      setShowUpdate(false)
                      setSelectedContract(null)
                      reset()
                    }}
                    sx={{
                      '& .MuiDialog-paper': { overflow: 'visible' }
                    }}
                  >
                    <DialogContent
                      sx={{
                        px: theme => [`${theme.spacing(5)} !important`, `${theme.spacing(15)} !important`],
                        py: theme => [`${theme.spacing(8)} !important`, `${theme.spacing(12.5)} !important`]
                      }}
                    >
                      <CustomCloseButton
                        onClick={() => {
                          setShowUpdate(false)
                          setSelectedContract(null)

                          reset()
                        }}
                      >
                        <Icon icon='tabler:x' fontSize='1.25rem' />
                      </CustomCloseButton>
                      <Box sx={{ mb: 4, textAlign: 'center' }}>
                        <Typography variant='h5' sx={{ mb: 3 }}>
                          Modifier les informations du contrat
                        </Typography>
                      </Box>

                      <form
                        onSubmit={handleSubmit(data => {
                          console.log('mouez')
                          // console.log('ggtgtg')
                          console.log('mouezzzzzzzz', data)
                          // let x = { ...data, owenId: data.client.value }
                          let x = { ...data, owenId: data.client.value, ownerType: 'person' }
                          // delete x.client
                          // delete x.ship
                          // delete x.Bateaux
                          console.log('xxxxxxxxxxx', x)
                          setShowUpdate(false)
                          updateCampany(data.id, x)

                          // updateClient(selectedClient?.id, x)
                        })}
                      >
                        <Controller
                          name={'SDate'}
                          control={control}
                          render={({ field }) => {
                            // console.log(field)
                            return (
                              <CustomTextField
                                {...field}
                                sx={{ mb: 4 }}
                                type='date'
                                variant='outlined'
                                size='small'
                                fullWidth
                                label={'Effet Du '}
                                error={!!errors['SDate']}
                                // helperText={errors['SDate']?.message}
                                helperText={'Ce champs requis'}
                              />
                            )
                          }}
                        />
                        <Controller
                          name={'EDate'}
                          control={control}
                          render={({ field }) => {
                            // console.log(field)
                            return (
                              <CustomTextField
                                {...field}
                                sx={{ mb: 4 }}
                                type='date'
                                variant='outlined'
                                size='small'
                                fullWidth
                                label={'Effet Au'}
                                error={!!errors['EDate']}
                                // helperText={errors['SDate']?.message}
                                helperText={'Ce champs requis'}
                              />
                            )
                          }}
                        />
                        <Controller
                          name={'Coqu'}
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              sx={{ mb: 4 }}
                              variant='outlined'
                              size='small'
                              fullWidth
                              label={'Coqu'}
                              error={!!errors['Coqu']}
                              helperText={'Ce champs requis'}
                              // helperText={errors['username']?.message}
                            />
                          )}
                        />
                        <Controller
                          name={'motor'}
                          control={control}
                          render={({ field }) => (
                            <CustomTextField
                              {...field}
                              sx={{ mb: 4 }}
                              variant='outlined'
                              size='small'
                              fullWidth
                              label={'Moteur'}
                              error={!!errors['motor']}
                              helperText={'Ce champs requis'}
                              // helperText={errors['username']?.message}
                            />
                          )}
                        />
                        <Controller
                          name={'client'}
                          control={control}
                          render={({ field }) => (
                            <CustomAutocomplete
                              options={clientsOption}
                              id='autocomplete-size-medium-multi'
                              {...field}
                              sx={{ mb: 4 }}
                              onChange={(e, v) => field.onChange(v)}
                              getOptionLabel={option => {
                                return option.label
                              }}
                              isOptionEqualToValue={(option, val) => {
                                return option.value === val.value
                              }}
                              renderInput={params => (
                                <CustomTextField
                                  {...params}
                                  size='small'
                                  label='Client'
                                  placeholder='Client'
                                  helperText={'Ce champs requis'}
                                />
                              )}
                            />
                          )}
                        />
                        {/* bateaux ici */}
                        {/* <Controller
                          name={'Bateaux'}
                          control={control}
                          render={({ field }) => (
                            <CustomAutocomplete
                              options={shipsOption}
                              id='autocomplete-size-medium-multi'
                              {...field}
                              sx={{ mb: 4 }}
                              onChange={(e, v) => field.onChange(v)}
                              getOptionLabel={option => {
                                return option.label
                              }}
                              isOptionEqualToValue={(option, val) => {
                                return option.value === val.value
                              }}
                              renderInput={params => (
                                <CustomTextField
                                  {...params}
                                  size='small'
                                  label='Bateaux'
                                  placeholder='Bateaux'
                                  helperText={'Ce champs requis'}
                                />
                              )}
                            />
                          )}
                        /> */}
                        <Button type='submit' variant='contained' color='primary' sx={{ mt: 5 }}>
                          Soumettre
                        </Button>
                      </form>

                      <Box
                        sx={{
                          rowGap: 2,
                          columnGap: 4,
                          display: 'flex',
                          flexWrap: 'wrap',
                          alignItems: 'center',
                          justifyContent: 'center'
                        }}
                      ></Box>
                    </DialogContent>
                  </Dialog>
                </Card>
              </Grid>
            </Grid>
          </DatePickerWrapper>
        </Grid>
      </Grid>
    </>
  )
}

export const getStaticProps = async () => {
  try {
    const contractsRes = await axios.get('http://localhost:4500/pcontract')
    const clientsRes = await axios.get('http://localhost:4500/client')
    const shipsRes = await axios.get('http://localhost:4500/ship')

    const contracts = contractsRes.data
    const clients = clientsRes.data
    const ships = shipsRes.data

 
    const result = contracts.map(contract => {
       const ship = ships.find(ship => ship.id === contract.ShipId)
      const client = clients.find(client => client.id === contract.ClientId)
      return {
        ...contract,
        shipName: ship?.name,
        clientName: client.Fname + ' ' + client.Lname
      }
    })

    return {
      props: {
        apiData: result,
        clients,
        ships
      }
    }
  } catch (error) {
    console.error('Error fetching API data:', error)
    return {
      props: {
        apiData: []
      }
    }
  }
}

export default InvoiceList
